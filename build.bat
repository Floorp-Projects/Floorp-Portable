@echo off
if "%GITHUB_ACTIONS%"=="true" (
  "C:\Program Files\Git\bin\bash.exe" -e -i build.sh
) else (
  "C:\msys64\usr\bin\env.exe" MSYS=winsymlinks:nativestrict CHERE_INVOKING=1 MSYSTEM=MINGW64 "C:\msys64\usr\bin\bash.exe" --login -e -i build.sh
)
