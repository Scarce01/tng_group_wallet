// Mock TNG approval app.
//
// Stands in for the real Touch'n Go eWallet app during the device-bind
// passwordless login demo. Lists pending DeviceBindChallenge rows for a
// given phone, shows the full binding details (phone, device, app,
// requestId, expiry countdown), and Approve/Reject sends a signed payload
// to the backend.
//
// The TNG_APPROVER_KEY here MUST match the backend's value (see
// backend/app/config.py). In a real deployment this key would live only
// on TNG's side and the backend would have its public key — for the
// demo we share an HMAC secret.

import 'dart:async';
import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// ---------------------------------------------------------------------------
// Configuration. Edit these to point at your backend / change the shared key.

const String kBackendBaseUrl = String.fromEnvironment(
  'BACKEND_BASE_URL',
  defaultValue: 'http://47.128.148.79:8000',
);

// Lambda approve-gate URL (API Gateway). Only the /approve call goes here;
// pending + reject still hit the backend directly.
const String kLambdaApproveUrl = String.fromEnvironment(
  'LAMBDA_APPROVE_URL',
  defaultValue: 'https://svzzb7sm2h.execute-api.ap-southeast-1.amazonaws.com/approve',
);

const String kTngApproverKey = String.fromEnvironment(
  'TNG_APPROVER_KEY',
  defaultValue: 'dev-tng-approver-key-change-me-32b!!',
);

// ---------------------------------------------------------------------------

void main() {
  runApp(const MockTngApp());
}

class MockTngApp extends StatelessWidget {
  const MockTngApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TNG Mock Approval',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0055D6),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF5F7FA),
      ),
      debugShowCheckedModeBanner: false,
      home: const ApprovalInboxPage(),
    );
  }
}

// ---------------------------------------------------------------------------
// Models

class DeviceBindChallenge {
  final String requestId;
  final String phone;
  final String deviceId;
  final String deviceLabel;
  final String appId;
  final String nonce;
  final String status;
  final DateTime expiresAt;
  final DateTime createdAt;
  final int expiresInSeconds;

  const DeviceBindChallenge({
    required this.requestId,
    required this.phone,
    required this.deviceId,
    required this.deviceLabel,
    required this.appId,
    required this.nonce,
    required this.status,
    required this.expiresAt,
    required this.createdAt,
    required this.expiresInSeconds,
  });

  factory DeviceBindChallenge.fromJson(Map<String, dynamic> j) {
    return DeviceBindChallenge(
      requestId: j['requestId'] as String,
      phone: j['phone'] as String,
      deviceId: j['deviceId'] as String,
      deviceLabel: (j['deviceLabel'] as String?) ?? '',
      appId: j['appId'] as String,
      nonce: j['nonce'] as String,
      status: j['status'] as String,
      expiresAt: DateTime.parse(j['expiresAt'] as String).toUtc(),
      createdAt: DateTime.parse(j['createdAt'] as String).toUtc(),
      expiresInSeconds: (j['expiresInSeconds'] as num).toInt(),
    );
  }
}

// ---------------------------------------------------------------------------
// Crypto — HMAC-SHA256 over the canonical challenge payload.

String _canonical(DeviceBindChallenge c) {
  final iso = c.expiresAt
      .toUtc()
      .toIso8601String()
      .replaceAll(RegExp(r'\.\d+'), ''); // YYYY-MM-DDTHH:MM:SSZ
  // Must match backend `_canonical()` byte-for-byte.
  return [
    'v1',
    c.requestId,
    c.phone,
    c.deviceId,
    c.appId,
    c.nonce,
    iso,
  ].join('|');
}

String approverSig(DeviceBindChallenge c) {
  final msg = '${_canonical(c)}|approved';
  final mac = Hmac(sha256, utf8.encode(kTngApproverKey));
  return mac.convert(utf8.encode(msg)).toString();
}

// ---------------------------------------------------------------------------
// API client

class ApprovalApi {
  static Future<List<DeviceBindChallenge>> pending(String phone) async {
    final uri = Uri.parse(
      '$kBackendBaseUrl/api/v1/auth/device-bind/pending?phone=${Uri.encodeQueryComponent(phone)}',
    );
    final r = await http.get(uri);
    if (r.statusCode != 200) {
      throw Exception('GET /pending failed: ${r.statusCode} ${r.body}');
    }
    final j = jsonDecode(r.body) as Map<String, dynamic>;
    final items = (j['items'] as List).cast<Map<String, dynamic>>();
    return items.map(DeviceBindChallenge.fromJson).toList();
  }

  static Future<void> approve(DeviceBindChallenge c) async {
    final uri = Uri.parse(kLambdaApproveUrl);
    final r = await http.post(
      uri,
      headers: {'content-type': 'application/json'},
      body: jsonEncode({
        'requestId': c.requestId,
        'deviceId': c.deviceId,
        'approverSig': approverSig(c),
        'phone': c.phone,
      }),
    );
    if (r.statusCode != 200) {
      throw Exception('Approve failed: ${r.statusCode} ${r.body}');
    }
  }

  static Future<void> reject(DeviceBindChallenge c) async {
    final uri = Uri.parse('$kBackendBaseUrl/api/v1/auth/device-bind/reject');
    final r = await http.post(
      uri,
      headers: {'content-type': 'application/json'},
      body: jsonEncode({
        'requestId': c.requestId,
        'deviceId': c.deviceId,
      }),
    );
    if (r.statusCode != 200) {
      throw Exception('Reject failed: ${r.statusCode} ${r.body}');
    }
  }
}

// ---------------------------------------------------------------------------
// UI

class ApprovalInboxPage extends StatefulWidget {
  const ApprovalInboxPage({super.key});

  @override
  State<ApprovalInboxPage> createState() => _ApprovalInboxPageState();
}

class _ApprovalInboxPageState extends State<ApprovalInboxPage> {
  final TextEditingController _phoneCtl =
      TextEditingController(text: '+60112345001');
  List<DeviceBindChallenge> _items = const [];
  String? _error;
  bool _loading = false;
  Timer? _autoRefresh;
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _refresh();
    // Auto-refresh inbox every 2s, and tick every 1s to update countdowns.
    _autoRefresh = Timer.periodic(
      const Duration(seconds: 2),
      (_) => _refresh(silent: true),
    );
    _ticker = Timer.periodic(
      const Duration(seconds: 1),
      (_) {
        if (mounted) setState(() {});
      },
    );
  }

  @override
  void dispose() {
    _autoRefresh?.cancel();
    _ticker?.cancel();
    _phoneCtl.dispose();
    super.dispose();
  }

  Future<void> _refresh({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final items = await ApprovalApi.pending(_phoneCtl.text.trim());
      if (!mounted) return;
      setState(() {
        _items = items;
        _error = null;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _approve(DeviceBindChallenge c) async {
    try {
      await ApprovalApi.approve(c);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Approved. Web app should sign in now.')),
      );
      await _refresh(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Approve failed: $e')),
      );
    }
  }

  Future<void> _reject(DeviceBindChallenge c) async {
    try {
      await ApprovalApi.reject(c);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Rejected.')),
      );
      await _refresh(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reject failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TNG Mock Approval'),
        backgroundColor: const Color(0xFF0055D6),
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              color: const Color(0xFF0055D6),
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _phoneCtl,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Account phone',
                        labelStyle: TextStyle(color: Colors.white70),
                        filled: true,
                        fillColor: Color(0x33FFFFFF),
                        border: OutlineInputBorder(borderSide: BorderSide.none),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _loading ? null : () => _refresh(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0055D6),
                    ),
                    child: const Text('Refresh'),
                  ),
                ],
              ),
            ),
            if (_error != null)
              Container(
                width: double.infinity,
                color: const Color(0xFFFEECEC),
                padding: const EdgeInsets.all(12),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Color(0xFFB42318)),
                ),
              ),
            Expanded(
              child: _items.isEmpty
                  ? const _EmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _items.length,
                      itemBuilder: (_, i) => _ChallengeCard(
                        c: _items[i],
                        onApprove: () => _approve(_items[i]),
                        onReject: () => _reject(_items[i]),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_clock, size: 56, color: Color(0xFF94A3B8)),
            SizedBox(height: 16),
            Text(
              'No pending sign-in requests',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            SizedBox(height: 6),
            Text(
              'Tap "Verify with TNG" on the web app to send one here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChallengeCard extends StatelessWidget {
  final DeviceBindChallenge c;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  const _ChallengeCard({
    required this.c,
    required this.onApprove,
    required this.onReject,
  });

  int _secondsLeft() {
    final s = c.expiresAt.difference(DateTime.now().toUtc()).inSeconds;
    return s < 0 ? 0 : s;
  }

  @override
  Widget build(BuildContext context) {
    final secs = _secondsLeft();
    final mm = (secs ~/ 60).toString();
    final ss = (secs % 60).toString().padLeft(2, '0');
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.shield_outlined, color: Color(0xFF0055D6)),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Sign-in approval requested',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: secs > 30
                        ? const Color(0xFFE0F2FE)
                        : const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '$mm:$ss',
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.w600,
                      color: secs > 30
                          ? const Color(0xFF075985)
                          : const Color(0xFF92400E),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _kv('Phone', c.phone),
            _kv('App', c.appId),
            _kv(
              'Device',
              c.deviceLabel.isEmpty ? c.deviceId : c.deviceLabel,
            ),
            _kv('Device id', c.deviceId, mono: true),
            _kv('Request id', c.requestId, mono: true),
            _kv('Nonce', c.nonce, mono: true),
            const SizedBox(height: 12),
            const Text(
              'By approving, you authorize a session for THIS device, app, '
              'and request. The approval expires when the timer ends and '
              'cannot be reused.',
              style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: secs == 0 ? null : onReject,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFB42318),
                      side: const BorderSide(color: Color(0xFFFCA5A5)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: secs == 0 ? null : onApprove,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0055D6),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Approve'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _kv(String k, String v, {bool mono = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 92,
            child: Text(
              k,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              v,
              style: TextStyle(
                fontSize: 13,
                color: const Color(0xFF0F172A),
                fontFamily: mono ? 'monospace' : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

