import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mock_approval/main.dart';

void main() {
  testWidgets('Approval inbox renders', (WidgetTester tester) async {
    await tester.pumpWidget(const MockTngApp());
    await tester.pump();
    expect(find.text('TNG Mock Approval'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
  });
}
