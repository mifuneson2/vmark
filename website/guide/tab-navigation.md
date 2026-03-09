# Smart Tab Navigation

VMark's Tab and Shift+Tab keys are context-aware — they help you navigate efficiently through formatted text, brackets, and links without reaching for arrow keys.

## Quick Overview

| Context | Tab Action | Shift+Tab Action |
|---------|------------|------------------|
| Inside brackets `()` `[]` `{}` | Jump past closing bracket | Jump before opening bracket |
| Inside quotes `""` `''` | Jump past closing quote | Jump before opening quote |
| Inside CJK brackets `「」` `『』` | Jump past closing bracket | Jump before opening bracket |
| Inside **bold**, *italic*, `code`, ~~strike~~ | Jump after the formatting | Jump before the formatting |
| Inside a link | Jump after the link | Jump before the link |
| In a table cell | Move to next cell | Move to previous cell |
| In a list item | Indent the item | Outdent the item |

## Bracket & Quote Escape

When your cursor is right before a closing bracket or quote, pressing Tab jumps over it. When your cursor is right after an opening bracket or quote, pressing Shift+Tab jumps back before it.

### Supported Characters

**Standard brackets and quotes:**
- Parentheses: `( )`
- Square brackets: `[ ]`
- Curly braces: `{ }`
- Double quotes: `" "`
- Single quotes: `' '`
- Backticks: `` ` ``

**CJK brackets:**
- Fullwidth parentheses: `（ ）`
- Lenticular brackets: `【 】`
- Corner brackets: `「 」`
- White corner brackets: `『 』`
- Double angle brackets: `《 》`
- Angle brackets: `〈 〉`

**Curly quotes:**
- Double curly quotes: `" "`
- Single curly quotes: `' '`

### How It Works

```
function hello(world|)
                    ↑ cursor before )
```

Press **Tab**:

```
function hello(world)|
                     ↑ cursor after )
```

This works with nested brackets too — Tab jumps over the immediately adjacent closing character.

Press **Shift+Tab** reverses the action — if cursor is right after an opening character:

```
function hello(|world)
               ↑ cursor after (
```

Press **Shift+Tab**:

```
function hello|(world)
              ↑ cursor before (
```

### CJK Example

```
这是「测试|」文字
         ↑ cursor before 」
```

Press **Tab**:

```
这是「测试」|文字
          ↑ cursor after 」
```

## Formatting Escape (WYSIWYG Mode)

In WYSIWYG mode, Tab and Shift+Tab can escape from inline formatting marks.

### Supported Formats

- **Bold** text
- *Italic* text
- `Inline code`
- ~~Strikethrough~~
- Links

### How It Works

When your cursor is anywhere inside formatted text:

```
This is **bold te|xt** here
                 ↑ cursor inside bold
```

Press **Tab**:

```
This is **bold text**| here
                     ↑ cursor after bold
```

Shift+Tab works in reverse — it jumps to the start of the formatting:

```
This is **bold te|xt** here
                 ↑ cursor inside bold
```

Press **Shift+Tab**:

```
This is |**bold text** here
        ↑ cursor before bold
```

### Link Escape

Tab and Shift+Tab also escape from links:

```
Check out [VMark|](https://vmark.app)
               ↑ cursor inside link text
```

Press **Tab**:

```
Check out [VMark](https://vmark.app)| and...
                                    ↑ cursor after link
```

Press **Shift+Tab** inside a link moves to the start:

```
Check out |[VMark](https://vmark.app) and...
          ↑ cursor before link
```

## Link Navigation (Source Mode)

In Source mode, Tab provides smart navigation within Markdown link syntax.

### Nested and Escaped Brackets

VMark handles complex link syntax correctly:

```markdown
[text [with nested] brackets](url)     ✓ Works
[text \[escaped\] brackets](url)       ✓ Works
[link](https://example.com/page(1))    ✓ Works
```

Tab navigation correctly identifies link boundaries even with nested or escaped brackets.

### Standard Links

```markdown
[link text|](url)
          ↑ cursor in text
```

Press **Tab** → cursor moves to URL:

```markdown
[link text](|url)
            ↑ cursor in URL
```

Press **Tab** again → cursor exits the link:

```markdown
[link text](url)|
                ↑ cursor after link
```

### Wiki Links

```markdown
[[page name|]]
           ↑ cursor in link
```

Press **Tab**:

```markdown
[[page name]]|
             ↑ cursor after link
```

## Source Mode: Markdown Character Escape

In Source mode, Tab also jumps over Markdown formatting characters:

| Characters | Used For |
|------------|----------|
| `*` | Bold/italic |
| `_` | Bold/italic |
| `^` | Superscript |
| `~~` | Strikethrough |
| `==` | Highlight |

### Example

```markdown
This is **bold|** text
              ↑ cursor before **
```

Press **Tab**:

```markdown
This is **bold**| text
                ↑ cursor after **
```

## Table Navigation

When cursor is inside a table:

| Action | Key |
|--------|-----|
| Next cell | Tab |
| Previous cell | Shift + Tab |
| Add row (at last cell) | Tab |

Tab at the last cell of the last row automatically adds a new row.

## List Indentation

When cursor is in a list item:

| Action | Key |
|--------|-----|
| Indent item | Tab |
| Outdent item | Shift + Tab |

## Settings

Tab escape behavior can be customized in **Settings → Editor**:

| Setting | Effect |
|---------|--------|
| **Auto-pair Brackets** | Enable/disable bracket pairing and Tab escape |
| **CJK Brackets** | Include CJK bracket pairs |
| **Curly Quotes** | Include curly quote pairs (`""` `''`) |

::: tip
If Tab escape conflicts with your workflow, you can disable auto-pair brackets entirely. Tab will then insert spaces (or indent in lists/tables) as normal.
:::

## Comparison: WYSIWYG vs Source Mode

| Feature | Tab (WYSIWYG) | Shift+Tab (WYSIWYG) | Source |
|---------|---------------|---------------------|--------|
| Bracket escape | ✓ (forward) | ✓ (backward) | ✓ |
| CJK bracket escape | ✓ (forward) | ✓ (backward) | ✓ |
| Curly quote escape | ✓ (forward) | ✓ (backward) | ✓ |
| Mark escape (bold, etc.) | ✓ (forward) | ✓ (backward) | N/A |
| Link escape | ✓ (forward) | ✓ (backward) | ✓ |
| Markdown char escape (`*`, `_`) | N/A | N/A | ✓ |
| Table navigation | Next cell | Previous cell | N/A |
| List indentation | Indent | Outdent | ✓ |
| Multi-cursor support | ✓ | ✓ | ✓ |

## Multi-Cursor Support

Tab escape works with multiple cursors — each cursor is processed independently.

### How It Works

When you have multiple cursors and press Tab or Shift+Tab:
- **Tab**: Cursors inside formatting escape to the end; cursors before closing brackets jump over them
- **Shift+Tab**: Cursors inside formatting escape to the start; cursors after opening brackets jump before them
- Cursors in plain text stay in place

### Example

```
**bold|** and [link|](url) and plain|
     ^1          ^2            ^3
```

Press **Tab**:

```
**bold**| and [link](url)| and plain|
        ^1               ^2         ^3
```

Each cursor escapes independently based on its context.

::: tip
This is particularly powerful for bulk editing — select multiple occurrences with `Mod + D`, then use Tab to escape from all of them at once.
:::

## Tips

1. **Muscle memory** — Once you get used to Tab escape, you'll find yourself navigating much faster without arrow keys.

2. **Works with auto-pair** — When you type `(`, VMark auto-inserts `)`. After typing inside, just Tab to jump out.

3. **Nested structures** — Tab escapes one level at a time. For `((nested))`, you need two Tabs to fully exit.

4. **Shift + Tab** — The mirror of Tab. Escapes backward from marks, links, and opening brackets. In tables, moves to the previous cell. In lists, outdents the item.

5. **Multi-cursor** — Tab escape works with all your cursors simultaneously, making bulk edits even faster.
