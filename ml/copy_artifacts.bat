@echo off
REM Copy trained ONNX + tokenizer + config into src/ml/ for Node.js inference.
setlocal
cd /d "%~dp0"

set DEST=..\src\ml
set MODELS=%DEST%\models
set TOK=%DEST%\tokenizer

if not exist "%MODELS%" mkdir "%MODELS%"
if not exist "%TOK%" mkdir "%TOK%"

echo Copying classifier...
copy /Y "transaction_classifier\models\tx_classifier.onnx" "%MODELS%\" || goto :err
copy /Y "transaction_classifier\models\distilbert-tx-classifier\label_mapping.json" "%MODELS%\" || goto :err
xcopy /Y /E /I "transaction_classifier\models\tokenizer\*" "%TOK%\" || goto :err

echo Copying anomaly detector...
copy /Y "anomaly_detector\models\anomaly_detector.onnx" "%MODELS%\" || goto :err
copy /Y "anomaly_detector\models\anomaly_config.json" "%MODELS%\" || goto :err

echo Done. Files placed in %DEST%
endlocal
exit /b 0

:err
echo Copy failed. Did you run run_training.bat first?
endlocal
exit /b 1
