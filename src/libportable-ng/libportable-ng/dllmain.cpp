#include "pch.h"
#include <windows.h>
#include <shlobj.h>
#include <shlwapi.h>
#include "MinHook.h"
#include <stdio.h>

void __declspec(dllexport) DummyExport() {}

void WriteLog(const char* topic, const WCHAR* message) {
    if (GetEnvironmentVariableW(L"PORTABLE_ENABLE_LOG", nullptr, 0) == 0) {
        return;
    }

    FILE* file = fopen("log.txt", "a");
    if (file == NULL) {
        return;
    }

    fprintf(file, "%s %ls\n", topic, message);

    fclose(file);
}


typedef HRESULT(WINAPI* OriginalSHGetKnownFolderPath)(
    REFKNOWNFOLDERID rfid,
    DWORD dwFlags,
    HANDLE hToken,
    PWSTR* ppszPath
);

OriginalSHGetKnownFolderPath pOriginalSHGetKnownFolderPath = nullptr;

HRESULT WINAPI HookedSHGetKnownFolderPath(
    REFKNOWNFOLDERID rfid,
    DWORD dwFlags,
    HANDLE hToken,
    PWSTR* ppszPath
) {
    if (rfid == FOLDERID_RoamingAppData) {
        WCHAR path[MAX_PATH];
        if (GetEnvironmentVariableW(L"PORTABLE_ROAMINGAPPDATA", path, MAX_PATH)) {
            return SHStrDupW(path, ppszPath);
        }
    }
    if (rfid == FOLDERID_LocalAppData) {
        WCHAR path[MAX_PATH];
        if (GetEnvironmentVariableW(L"PORTABLE_LOCALAPPDATA", path, MAX_PATH)) {
            return SHStrDupW(path, ppszPath);
        }
    }

    return pOriginalSHGetKnownFolderPath(rfid, dwFlags, hToken, ppszPath);
}


typedef LSTATUS(WINAPI* OriginalRegCreateKeyExW)(
    HKEY hKey,
    LPCWSTR lpSubKey,
    DWORD Reserved,
    LPWSTR lpClass,
    DWORD dwOptions,
    REGSAM samDesired,
    const LPSECURITY_ATTRIBUTES lpSecurityAttributes,
    PHKEY phkResult,
    LPDWORD lpdwDisposition
);

OriginalRegCreateKeyExW pOriginalRegCreateKeyExW = nullptr;

LSTATUS WINAPI HookedRegCreateKeyExW(
    HKEY hKey,
    LPCWSTR lpSubKey,
    DWORD Reserved,
    LPWSTR lpClass,
    DWORD dwOptions,
    REGSAM samDesired,
    const LPSECURITY_ATTRIBUTES lpSecurityAttributes,
    PHKEY phkResult,
    LPDWORD lpdwDisposition
) {
    if (wcslen(lpSubKey) == 0) {
        return pOriginalRegCreateKeyExW(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult, lpdwDisposition);
    }
    WriteLog("CreateKeyExW", lpSubKey);
    return ERROR_REGISTRY_IO_FAILED;
};


typedef LSTATUS(WINAPI* OriginalRegCreateKeyTransactedW)(
    HKEY hKey,
    LPCWSTR lpSubKey,
    DWORD Reserved,
    LPWSTR lpClass,
    DWORD dwOptions,
    REGSAM samDesired,
    const LPSECURITY_ATTRIBUTES lpSecurityAttributes,
    PHKEY phkResult,
    LPDWORD lpdwDisposition,
    HANDLE hTransaction,
    PVOID pExtendedParemeter
);

OriginalRegCreateKeyTransactedW pOriginalRegCreateKeyTransactedW = nullptr;

LSTATUS WINAPI HookedRegCreateKeyTransactedW(
    HKEY hKey,
    LPCWSTR lpSubKey,
    DWORD Reserved,
    LPWSTR lpClass,
    DWORD dwOptions,
    REGSAM samDesired,
    const LPSECURITY_ATTRIBUTES lpSecurityAttributes,
    PHKEY phkResult,
    LPDWORD lpdwDisposition,
    HANDLE hTransaction,
    PVOID pExtendedParemeter
) {
    if (wcslen(lpSubKey) == 0) {
        return pOriginalRegCreateKeyTransactedW(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult, lpdwDisposition, hTransaction, pExtendedParemeter);
    }
    WriteLog("CreateKeyTransactedW", lpSubKey);
    return ERROR_REGISTRY_IO_FAILED;
};


typedef LSTATUS(WINAPI* OriginalRegDeleteKeyW)(
    HKEY    hKey,
    LPCWSTR lpSubKey
);

OriginalRegDeleteKeyW pOriginalRegDeleteKeyW = nullptr;

LSTATUS WINAPI HookedRegDeleteKeyW(
    HKEY    hKey,
    LPCWSTR lpSubKey
) {
    WriteLog("DeleteKeyW", lpSubKey);
    return ERROR_REGISTRY_IO_FAILED;
};


typedef LSTATUS(WINAPI* OriginalRegDeleteKeyExW)(
    HKEY hKey,
    LPCWSTR lpSubKey,
    REGSAM samDesired,
    DWORD Reserved
);

OriginalRegDeleteKeyExW pOriginalRegDeleteKeyExW = nullptr;

LSTATUS WINAPI HookedRegDeleteKeyExW(
    HKEY hKey,
    LPCWSTR lpSubKey,
    REGSAM samDesired,
    DWORD Reserved
) {
    WriteLog("DeleteKeyExW", lpSubKey);
    return ERROR_REGISTRY_IO_FAILED;
};


typedef LSTATUS(WINAPI* OriginalRegDeleteKeyTransactedW)(
    HKEY hKey,
    LPCWSTR lpSubKey,
    REGSAM samDesired,
    DWORD Reserved,
    HANDLE hTransacted,
    PVOID pExtendedParameter
);

OriginalRegDeleteKeyTransactedW pOriginalRegDeleteKeyTransactedW = nullptr;

LSTATUS WINAPI HookedRegDeleteKeyTransactedW(
    HKEY hKey,
    LPCWSTR lpSubKey,
    REGSAM samDesired,
    DWORD Reserved,
    HANDLE hTransacted,
    PVOID pExtendedParameter
) {
    WriteLog("DeleteKeyTransacted", lpSubKey);
    return ERROR_REGISTRY_IO_FAILED;
};


typedef LSTATUS(WINAPI* OriginalRegSetKeyValueW)(
    HKEY hKey,
    LPCWSTR lpSubKey,
    LPCWSTR lpValueName,
    DWORD dwType,
    LPCVOID lpData,
    DWORD cbData
);

OriginalRegSetKeyValueW pOriginalRegSetKeyValueW = nullptr;

LSTATUS WINAPI HookedRegSetKeyValueW(
    HKEY hKey,
    LPCWSTR lpSubKey,
    LPCWSTR lpValueName,
    DWORD dwType,
    LPCVOID lpData,
    DWORD cbData
) {
    WriteLog("SetKeyValueW", lpSubKey);
    return ERROR_REGISTRY_IO_FAILED;
}


typedef LSTATUS(WINAPI* OriginalRegSetValueW)(
    HKEY hKey,
    LPCWSTR lpSubKey,
    DWORD dwType,
    LPCVOID lpData,
    DWORD cbData
);

OriginalRegSetValueW pOriginalRegSetValueW = nullptr;

LSTATUS WINAPI HookedRegSetValueW(
    HKEY hKey,
    LPCWSTR lpSubKey,
    DWORD dwType,
    LPCVOID lpData,
    DWORD cbData
) {
    WriteLog("SetValueW", lpSubKey);
    return ERROR_REGISTRY_IO_FAILED;
}


typedef LSTATUS(WINAPI* OriginalRegSetValueExW)(
    HKEY hKey,
    LPCWSTR lpValueName,
    DWORD Reserved,
    DWORD dwType,
    const BYTE* lpData,
    DWORD cbData
);

OriginalRegSetValueExW pOriginalRegSetValueExW = nullptr;

LSTATUS WINAPI HookedRegSetValueExW(
    HKEY hKey,
    LPCWSTR lpValueName,
    DWORD Reserved,
    DWORD dwType,
    const BYTE* lpData,
    DWORD cbData
) {
    WriteLog("SetValueExW", lpValueName);
    return ERROR_REGISTRY_IO_FAILED;
};


typedef LSTATUS(WINAPI* OriginalRegDeleteValueW)(
    HKEY hKey,
    LPCWSTR lpValueName
);

OriginalRegDeleteValueW pOriginalRegDeleteValueW = nullptr;

LSTATUS WINAPI HookedRegDeleteValueW(
    HKEY hKey,
    LPCWSTR lpValueName
) {
    WriteLog("DeleteValueW", lpValueName);
    return ERROR_REGISTRY_IO_FAILED;
}


typedef LSTATUS(WINAPI* OriginalRegDeleteTreeW)(
    HKEY hKey,
    LPCWSTR lpSubKey
);

OriginalRegDeleteTreeW pOriginalRegDeleteTreeW = nullptr;

LSTATUS WINAPI HookedRegDeleteTreeW(
    HKEY hKey,
    LPCWSTR lpSubKey
) {
    WriteLog("DeleteTreeW", lpSubKey);
    return ERROR_REGISTRY_IO_FAILED;
}


typedef LSTATUS(WINAPI* OriginalRegDeleteKeyValueW)(
    HKEY hKey,
    LPCWSTR lpSubKey,
    LPCWSTR lpValueName
);

OriginalRegDeleteKeyValueW pOriginalRegDeleteKeyValueW = nullptr;

LSTATUS WINAPI HookedRegDeleteKeyValueW(
    HKEY hKey,
    LPCWSTR lpSubKey,
    LPCWSTR lpValueName
) {
    WriteLog("DeleteKeyValueW", lpValueName);
    return ERROR_REGISTRY_IO_FAILED;
}


BOOL APIENTRY DllMain(HMODULE hModule, DWORD ulReasonForCall, LPVOID lpReserved) {
    if (ulReasonForCall == DLL_PROCESS_ATTACH) {
        if (MH_Initialize() != MH_OK) {
            return FALSE;
        }

        HMODULE hShell32 = LoadLibrary(L"Shell32.dll");
        if (!hShell32) {
            return FALSE;
        }

        LPVOID pSHGetKnownFolderPath = (LPVOID) GetProcAddress(hShell32, "SHGetKnownFolderPath");
        if (!pSHGetKnownFolderPath) {
            return FALSE;
        }
        if (MH_CreateHook(pSHGetKnownFolderPath, (LPVOID) &HookedSHGetKnownFolderPath, reinterpret_cast<LPVOID*>(&pOriginalSHGetKnownFolderPath)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pSHGetKnownFolderPath) != MH_OK) {
            return FALSE;
        }

        // Registry APIs

        HMODULE hAdvapi32 = LoadLibrary(L"Advapi32.dll");
        if (!hAdvapi32) {
            return FALSE;
        }

        LPVOID pRegCreateKeyExW = (LPVOID) GetProcAddress(hAdvapi32, "RegCreateKeyExW");
        if (!pRegCreateKeyExW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegCreateKeyExW, (LPVOID) &HookedRegCreateKeyExW, reinterpret_cast<LPVOID*>(&pOriginalRegCreateKeyExW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegCreateKeyExW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegCreateKeyTransactedW = (LPVOID) GetProcAddress(hAdvapi32, "RegCreateKeyTransactedW");
        if (!pRegCreateKeyTransactedW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegCreateKeyTransactedW, (LPVOID) &HookedRegCreateKeyTransactedW, reinterpret_cast<LPVOID*>(&pOriginalRegCreateKeyTransactedW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegCreateKeyTransactedW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegDeleteKeyW = (LPVOID) GetProcAddress(hAdvapi32, "RegDeleteKeyW");
        if (!pRegDeleteKeyW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegDeleteKeyW, (LPVOID) &HookedRegDeleteKeyW, reinterpret_cast<LPVOID*>(&pOriginalRegDeleteKeyW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegDeleteKeyW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegDeleteKeyExW = (LPVOID) GetProcAddress(hAdvapi32, "RegDeleteKeyExW");
        if (!pRegDeleteKeyExW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegDeleteKeyExW, (LPVOID) &HookedRegDeleteKeyExW, reinterpret_cast<LPVOID*>(&pOriginalRegDeleteKeyExW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegDeleteKeyExW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegDeleteKeyTransactedW = (LPVOID) GetProcAddress(hAdvapi32, "RegDeleteKeyTransactedW");
        if (!pRegDeleteKeyTransactedW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegDeleteKeyTransactedW, (LPVOID) &HookedRegDeleteKeyTransactedW, reinterpret_cast<LPVOID*>(&pOriginalRegDeleteKeyTransactedW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegDeleteKeyTransactedW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegSetKeyValueW = (LPVOID) GetProcAddress(hAdvapi32, "RegSetKeyValueW");
        if (!pRegSetKeyValueW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegSetKeyValueW, (LPVOID) &HookedRegSetKeyValueW, reinterpret_cast<LPVOID*>(&pOriginalRegSetKeyValueW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegSetKeyValueW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegSetValueW = (LPVOID) GetProcAddress(hAdvapi32, "RegSetValueW");
        if (!pRegSetValueW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegSetValueW, (LPVOID) &HookedRegSetValueW, reinterpret_cast<LPVOID*>(&pOriginalRegSetValueW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegSetValueW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegSetValueExW = (LPVOID) GetProcAddress(hAdvapi32, "RegSetValueExW");
        if (!pRegSetValueExW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegSetValueExW, (LPVOID) &HookedRegSetValueExW, reinterpret_cast<LPVOID*>(&pOriginalRegSetValueExW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegSetValueExW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegDeleteValueW = (LPVOID) GetProcAddress(hAdvapi32, "RegDeleteValueW");
        if (!pRegDeleteValueW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegDeleteValueW, (LPVOID) &HookedRegDeleteValueW, reinterpret_cast<LPVOID*>(&pOriginalRegDeleteValueW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegDeleteValueW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegDeleteTreeW = (LPVOID) GetProcAddress(hAdvapi32, "RegDeleteTreeW");
        if (!pRegDeleteTreeW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegDeleteTreeW, (LPVOID) &HookedRegDeleteTreeW, reinterpret_cast<LPVOID*>(&pOriginalRegDeleteTreeW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegDeleteTreeW) != MH_OK) {
            return FALSE;
        }

        LPVOID pRegDeleteKeyValueW = (LPVOID) GetProcAddress(hAdvapi32, "RegDeleteKeyValueW");
        if (!pRegDeleteKeyValueW) {
            return FALSE;
        }
        if (MH_CreateHook(pRegDeleteKeyValueW, (LPVOID) &HookedRegDeleteKeyValueW, reinterpret_cast<LPVOID*>(&pOriginalRegDeleteKeyValueW)) != MH_OK) {
            return FALSE;
        }
        if (MH_EnableHook(pRegDeleteKeyValueW) != MH_OK) {
            return FALSE;
        }
    }
    else if (ulReasonForCall == DLL_PROCESS_DETACH) {
        MH_DisableHook(MH_ALL_HOOKS);

        MH_Uninitialize();
    }
    return TRUE;
}
