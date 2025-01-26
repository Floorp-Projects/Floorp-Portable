CXX ?= g++
TARGET := libportable-ng.dll
SRCS := $(wildcard *.cpp)
OBJS := $(SRCS:.cpp=.o)
DEPS := $(SRCS:.cpp=.d)
INCDIR := -I../minhook/include
LIBDIR := -L../minhook
LIBS := -lMinHook -lshlwapi -luuid
CFLAGS := -DUNICODE
LDFLAGS :=

all: $(TARGET)

-include $(DEPS)

$(TARGET): $(OBJS)
	$(CXX) -o $@ -shared $^ $(LIBDIR) $(LIBS)

.cpp.o:
	$(CXX) -o $@ -c -MMD -MP $(CFLAGS) $(INCDIR) $<

clean:
	rm -f $(OBJS) $(DEPS) $(TARGET)
