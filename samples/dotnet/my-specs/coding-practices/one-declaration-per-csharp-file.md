# One Declaration per C# File

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-07-09

Applies to: `$myspec-implement` and implementation-focused findings from `$myspec-quantify`

## Rule

Declare only one C# type or delegate per `.cs` file. This includes classes, records, structs, interfaces, enums, and delegates, whether declared at namespace or nested scope. Name the file after its sole declaration.

The only exception is a family of interfaces with the same name that intentionally provides distinct generic versions. Multiple interface declarations may share a file only when they differ by their generic type parameters or generic constraints and each declaration is needed as part of that interface family. Do not use this exception for classes, records, structs, enums, delegates, unrelated interfaces, or convenience types.

When a declaration needs a supporting type, move that type to its own appropriately named `.cs` file, even when it is private or used by only one consumer.

## Verification

- Each changed `.cs` file contains exactly one type or delegate declaration.
- A file containing multiple declarations contains only the allowed interface family, and the generic parameters or constraints distinguish every interface declaration.
- New or moved files are named after their declared type or delegate.

## Approval

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-07-09
