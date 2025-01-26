
all: libMinHook.a libportable-ng.dll

libportable-ng.dll: libMinHook.a
	cd $(PWD)/libportable-ng && make

libMinHook.a:
	cd $(PWD)/minhook && make -f build/MinGW/Makefile libMinHook.a

clean:
	cd $(PWD)/libportable-ng && make clean
	cd $(PWD)/minhook && make -f build/MinGW/Makefile clean
