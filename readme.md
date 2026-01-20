#Connecting app
- connect usb
- enable usb thretning
- find ip in pc from ipconfig command
- change ip in app
- change port to 9002
- Done

#Build app
```powershell
$env:NODE_ENV="production"
```
```powershell
.\gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon```