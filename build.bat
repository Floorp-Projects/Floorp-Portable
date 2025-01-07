@echo off
if %GITHUB_ACTIONS% == true (
  "C:\Program Files\Git\bin\bash.exe" -e -i build.sh
) else (
  "C:\msys2\usr\bin\env.exe" MSYS=winsymlinks:nativestrict CHERE_INVOKING=1 MSYSTEM=MINGW64 "C:\msys2\usr\bin\bash.exe" -e -i build.sh
)
