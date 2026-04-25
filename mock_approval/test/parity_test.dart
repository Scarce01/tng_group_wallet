import 'package:flutter_test/flutter_test.dart';

import 'package:mock_approval/main.dart';

void main() {
  test('canonical + approverSig match the Python backend byte-for-byte', () {
    final c = DeviceBindChallenge(
      requestId: 'dbc_test123',
      phone: '+60112345001',
      deviceId: 'dev_abc',
      deviceLabel: '',
      appId: 'tng-group-wallet-web',
      nonce: 'nx12',
      status: 'PENDING',
      expiresAt: DateTime.utc(2026, 4, 25, 12, 34, 56),
      createdAt: DateTime.utc(2026, 4, 25, 12, 30, 0),
      expiresInSeconds: 60,
    );

    expect(
      approverSig(c),
      '8cdcabbe2b17844d5f6c24163fb35192cc8055f7e88944c07be16385d0995160',
    );
  });
}
