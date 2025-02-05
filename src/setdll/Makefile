CXX ?= g++
TARGET := setdll.exe
SRCS := ./detours/src/image.cpp ./detours/src/detours.cpp ./detours/src/modules.cpp ./detours/src/disasm.cpp ./detours/samples/setdll/setdll.cpp
OBJS := $(SRCS:.cpp=.o)
DEPS := $(SRCS:.cpp=.d)
INCDIR := -I./detours/src
LIBDIR :=
LIBS :=
CFLAGS :=
LDFLAGS := -s -static -static-libgcc -static-libstdc++

all: $(TARGET)

-include $(DEPS)

$(TARGET): $(OBJS)
	$(CXX) -o $@ $(LDFLAGS) $^ $(LIBDIR) $(LIBS)

.cpp.o:
	$(CXX) -o $@ -c -MMD -MP $(CFLAGS) $(INCDIR) $<

clean:
	rm -f $(OBJS) $(DEPS) $(TARGET)
