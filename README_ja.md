# Floorp Portable

**注意: 現在サポートしているのはWindowsのみです。また、自動更新機能は10.8.0以下のバージョンでは利用できません。**

**警告: これは現在ベータ版です。予期せぬトラブルが発生する可能性があります。**

ポータブルランタイムには[libportable](https://github.com/adonais/libportable)を使用しています。

## 構築方法
### 1. Floorpを設置する。
coreディレクトリを作成して、中にFloorpのファイルを設置してください。

### 2. ビルドする
Windows
```
.\build.bat
```
Linux
```
./build.sh
```

### 3. パッチを適用する
ビルドしたpatcher.exeを実行してパッチを適用します。

これで完了です。
ポータブル版の実行に必要なファイルとディレクトリは、`core`と`floorp.exe`です。
