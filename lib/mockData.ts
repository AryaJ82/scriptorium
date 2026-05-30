


export const STARTER_CODE: Record<string, string> = {
    PYTHON: `def greet(name: str) -> str:
    return f"Hello, {name}!"


if __name__ == "__main__":
    who = input("Who shall we greet? ")
    print(greet(who or "world"))`,
    JAVASCRIPT: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));`,
    TYPESCRIPT: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));`,
    CPP: `#include <iostream>
#include <string>

int main() {
  std::string name;
  std::getline(std::cin, name);
  std::cout << "Hello, " << (name.empty() ? "world" : name) << "!\\n";
  return 0;
}`,
    C: `#include <stdio.h>

int main(void) {
  printf("Hello, world!\\n");
  return 0;
}`,
    JAVA: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, world!");
  }
}`,
}
