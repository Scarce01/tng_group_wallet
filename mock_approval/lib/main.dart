// Mock TNG approval app.
//
// Stands in for the real Touch'n Go eWallet app during the device-bind
// passwordless login AND payment approval demos. Lists pending challenges
// for a given phone, shows binding details, and Approve/Reject sends a
// signed payload to the Lambda.

import 'dart:async';
import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// ---------------------------------------------------------------------------
// Configuration.

const String kBackendBaseUrl = String.fromEnvironment(
  'BACKEND_BASE_URL',
  defaultValue: 'http://47.128.148.79:8000',
);

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

class PaymentApprovalChallenge {
  final String requestId;
  final String phone;
  final String deviceId;
  final String poolId;
  final String amount;
  final String merchantName;
  final String category;
  final String nonce;
  final String status;
  final DateTime expiresAt;
  final DateTime createdAt;
  final int expiresInSeconds;

  const PaymentApprovalChallenge({
    required this.requestId,
    required this.phone,
    required this.deviceId,
    required this.poolId,
    required this.amount,
    required this.merchantName,
    required this.category,
    required this.nonce,
    required this.status,
    required this.expiresAt,
    required this.createdAt,
    required this.expiresInSeconds,
  });

  factory PaymentApprovalChallenge.fromJson(Map<String, dynamic> j) {
    return PaymentApprovalChallenge(
      requestId: j['requestId'] as String,
      phone: j['phone'] as String,
      deviceId: j['deviceId'] as String,
      poolId: j['poolId'] as String,
      amount: j['amount'] as String,
      merchantName: j['merchantName'] as String,
      category: j['category'] as String,
      nonce: j['nonce'] as String,
      status: j['status'] as String,
      expiresAt: DateTime.parse(j['expiresAt'] as String).toUtc(),
      createdAt: DateTime.parse(j['createdAt'] as String).toUtc(),
      expiresInSeconds: (j['expiresInSeconds'] as num).toInt(),
    );
  }
}

// ---------------------------------------------------------------------------
// Crypto — HMAC-SHA256 over canonical payloads.

String _canonicalDeviceBind(DeviceBindChallenge c) {
  final iso = c.expiresAt
      .toUtc()
      .toIso8601String()
      .replaceAll(RegExp(r'\.\d+'), '');
  return [
    'v1', c.requestId, c.phone, c.deviceId, c.appId, c.nonce, iso,
  ].join('|');
}

String _canonicalPayment(PaymentApprovalChallenge c) {
  final iso = c.expiresAt
      .toUtc()
      .toIso8601String()
      .replaceAll(RegExp(r'\.\d+'), '');
  // amount must match backend's "{:.2f}" format
  final amt = double.parse(c.amount).toStringAsFixed(2);
  return [
    'v1', c.requestId, c.phone, c.deviceId, c.poolId,
    amt, c.merchantName, c.nonce, iso,
  ].join('|');
}

String approverSigDeviceBind(DeviceBindChallenge c) {
  final msg = '${_canonicalDeviceBind(c)}|approved';
  final mac = Hmac(sha256, utf8.encode(kTngApproverKey));
  return mac.convert(utf8.encode(msg)).toString();
}

String approverSigPayment(PaymentApprovalChallenge c) {
  final msg = '${_canonicalPayment(c)}|approved';
  final mac = Hmac(sha256, utf8.encode(kTngApproverKey));
  return mac.convert(utf8.encode(msg)).toString();
}

// ---------------------------------------------------------------------------
// API client

class ApprovalApi {
  // ── Device-bind ──
  static Future<List<DeviceBindChallenge>> pendingDeviceBind(String phone) async {
    final uri = Uri.parse(
      '$kBackendBaseUrl/api/v1/auth/device-bind/pending?phone=${Uri.encodeQueryComponent(phone)}',
    );
    final r = await http.get(uri);
    if (r.statusCode != 200) {
      throw Exception('GET device-bind/pending failed: ${r.statusCode} ${r.body}');
    }
    final j = jsonDecode(r.body) as Map<String, dynamic>;
    final items = (j['items'] as List).cast<Map<String, dynamic>>();
    return items.map(DeviceBindChallenge.fromJson).toList();
  }

  static Future<void> approveDeviceBind(DeviceBindChallenge c) async {
    final uri = Uri.parse(kLambdaApproveUrl);
    final r = await http.post(
      uri,
      headers: {'content-type': 'application/json'},
      body: jsonEncode({
        'requestId': c.requestId,
        'deviceId': c.deviceId,
        'approverSig': approverSigDeviceBind(c),
        'phone': c.phone,
      }),
    );
    if (r.statusCode != 200) {
      throw Exception('Approve failed: ${r.statusCode} ${r.body}');
    }
  }

  static Future<void> rejectDeviceBind(DeviceBindChallenge c) async {
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

  // ── Payment approval ──
  static Future<List<PaymentApprovalChallenge>> pendingPayments(String phone) async {
    final uri = Uri.parse(
      '$kBackendBaseUrl/api/v1/payment-approval/pending?phone=${Uri.encodeQueryComponent(phone)}',
    );
    final r = await http.get(uri);
    if (r.statusCode != 200) {
      throw Exception('GET payment-approval/pending failed: ${r.statusCode} ${r.body}');
    }
    final j = jsonDecode(r.body) as Map<String, dynamic>;
    final items = (j['items'] as List).cast<Map<String, dynamic>>();
    return items.map(PaymentApprovalChallenge.fromJson).toList();
  }

  static Future<void> approvePayment(PaymentApprovalChallenge c) async {
    final uri = Uri.parse(kLambdaApproveUrl);
    final r = await http.post(
      uri,
      headers: {'content-type': 'application/json'},
      body: jsonEncode({
        'requestId': c.requestId,
        'deviceId': c.deviceId,
        'approverSig': approverSigPayment(c),
        'phone': c.phone,
      }),
    );
    if (r.statusCode != 200) {
      throw Exception('Payment approve failed: ${r.statusCode} ${r.body}');
    }
  }

  static Future<void> rejectPayment(PaymentApprovalChallenge c) async {
    final uri = Uri.parse('$kBackendBaseUrl/api/v1/payment-approval/reject');
    final r = await http.post(
      uri,
      headers: {'content-type': 'application/json'},
      body: jsonEncode({
        'requestId': c.requestId,
        'deviceId': c.deviceId,
      }),
    );
    if (r.statusCode != 200) {
      throw Exception('Payment reject failed: ${r.statusCode} ${r.body}');
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

class _ApprovalInboxPageState extends State<ApprovalInboxPage>
    with SingleTickerProviderStateMixin {
  final TextEditingController _phoneCtl =
      TextEditingController(text: '+60112345001');
  List<DeviceBindChallenge> _deviceBindItems = const [];
  List<PaymentApprovalChallenge> _paymentItems = const [];
  String? _error;
  bool _loading = false;
  Timer? _autoRefresh;
  Timer? _ticker;
  late TabController _tabCtl;

  @override
  void initState() {
    super.initState();
    _tabCtl = TabController(length: 2, vsync: this);
    _refresh();
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
    _tabCtl.dispose();
    super.dispose();
  }

  Future<void> _refresh({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final phone = _phoneCtl.text.trim();
      final dbItems = await ApprovalApi.pendingDeviceBind(phone);
      final payItems = await ApprovalApi.pendingPayments(phone);
      if (!mounted) return;
      setState(() {
        _deviceBindItems = dbItems;
        _paymentItems = payItems;
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

  Future<void> _approveDeviceBind(DeviceBindChallenge c) async {
    try {
      await ApprovalApi.approveDeviceBind(c);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Login approved ✓')),
      );
      await _refresh(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Approve failed: $e')),
      );
    }
  }

  Future<void> _rejectDeviceBind(DeviceBindChallenge c) async {
    try {
      await ApprovalApi.rejectDeviceBind(c);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Login rejected.')),
      );
      await _refresh(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reject failed: $e')),
      );
    }
  }

  Future<void> _approvePayment(PaymentApprovalChallenge c) async {
    try {
      await ApprovalApi.approvePayment(c);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment RM${c.amount} to ${c.merchantName} approved ✓')),
      );
      await _refresh(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment approve failed: $e')),
      );
    }
  }

  Future<void> _rejectPayment(PaymentApprovalChallenge c) async {
    try {
      await ApprovalApi.rejectPayment(c);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment rejected.')),
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
    final payBadge = _paymentItems.isNotEmpty ? ' (${_paymentItems.length})' : '';
    final dbBadge = _deviceBindItems.isNotEmpty ? ' (${_deviceBindItems.length})' : '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('TNG Mock Approval'),
        backgroundColor: const Color(0xFF0055D6),
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabCtl,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          indicatorColor: Colors.white,
          tabs: [
            Tab(text: 'Sign-in$dbBadge'),
            Tab(text: 'Payments$payBadge'),
          ],
        ),
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
              child: TabBarView(
                controller: _tabCtl,
                children: [
                  // Tab 1: Device-bind sign-in
                  _deviceBindItems.isEmpty
                      ? const _EmptyState(message: 'No pending sign-in requests',
                          hint: 'Tap "Verify with TNG" on the web app to send one here.')
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _deviceBindItems.length,
                          itemBuilder: (_, i) => _DeviceBindCard(
                            c: _deviceBindItems[i],
                            onApprove: () => _approveDeviceBind(_deviceBindItems[i]),
                            onReject: () => _rejectDeviceBind(_deviceBindItems[i]),
                          ),
                        ),
                  // Tab 2: Payment approvals
                  _paymentItems.isEmpty
                      ? const _EmptyState(message: 'No pending payment approvals',
                          hint: 'Tap "Secure Pay" on the web app to send a payment approval here.')
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _paymentItems.length,
                          itemBuilder: (_, i) => _PaymentCard(
                            c: _paymentItems[i],
                            onApprove: () => _approvePayment(_paymentItems[i]),
                            onReject: () => _rejectPayment(_paymentItems[i]),
                          ),
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String message;
  final String hint;
  const _EmptyState({required this.message, required this.hint});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock_clock, size: 56, color: Color(0xFF94A3B8)),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            Text(
              hint,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Device-bind card (existing) ──

class _DeviceBindCard extends StatelessWidget {
  final DeviceBindChallenge c;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  const _DeviceBindCard({
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
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ),
                _TimerBadge(secs: secs, mm: mm, ss: ss),
              ],
            ),
            const SizedBox(height: 12),
            _kv('Phone', c.phone),
            _kv('App', c.appId),
            _kv('Device', c.deviceLabel.isEmpty ? c.deviceId : c.deviceLabel),
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
            _ApproveRejectRow(secs: secs, onApprove: onApprove, onReject: onReject),
          ],
        ),
      ),
    );
  }
}

// ── Payment approval card ──

class _PaymentCard extends StatelessWidget {
  final PaymentApprovalChallenge c;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  const _PaymentCard({
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
      elevation: 2,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFF059669).withOpacity(0.3)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.payment, color: Color(0xFF059669)),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Payment approval requested',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                  ),
                  _TimerBadge(secs: secs, mm: mm, ss: ss),
                ],
              ),
              const SizedBox(height: 16),
              // Amount hero
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0059BD), Color(0xFF1777B1)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Text(
                      'RM ${double.parse(c.amount).toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 28, fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      c.merchantName,
                      style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w600,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      c.category,
                      style: const TextStyle(fontSize: 12, color: Colors.white54),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _kv('Phone', c.phone),
              _kv('Pool ID', c.poolId, mono: true),
              _kv('Device', c.deviceId, mono: true),
              _kv('Request', c.requestId, mono: true),
              _kv('Nonce', c.nonce, mono: true),
              const SizedBox(height: 12),
              const Text(
                'By approving, you authorize RM payment from the pool. '
                'This approval is one-time and expires when the timer ends.',
                style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
              ),
              const SizedBox(height: 12),
              _ApproveRejectRow(
                secs: secs, onApprove: onApprove, onReject: onReject,
                approveColor: const Color(0xFF059669),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Shared widgets ──

class _TimerBadge extends StatelessWidget {
  final int secs;
  final String mm;
  final String ss;
  const _TimerBadge({required this.secs, required this.mm, required this.ss});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: secs > 30 ? const Color(0xFFE0F2FE) : const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '$mm:$ss',
        style: TextStyle(
          fontFamily: 'monospace',
          fontWeight: FontWeight.w600,
          color: secs > 30 ? const Color(0xFF075985) : const Color(0xFF92400E),
        ),
      ),
    );
  }
}

class _ApproveRejectRow extends StatelessWidget {
  final int secs;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  final Color approveColor;
  const _ApproveRejectRow({
    required this.secs, required this.onApprove, required this.onReject,
    this.approveColor = const Color(0xFF0055D6),
  });

  @override
  Widget build(BuildContext context) {
    return Row(
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
              backgroundColor: approveColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            child: const Text('Approve'),
          ),
        ),
      ],
    );
  }
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

