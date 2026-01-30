# Smart Tab Navigation

VMark's Tab key is context-aware — it helps you navigate efficiently through formatted text, brackets, and links without reaching for arrow keys.

## Quick Overview

| Context | Tab Action |
|---------|------------|
| Inside brackets `()` `[]` `{}` | Jump past closing bracket |
| Inside quotes `""` `''` | Jump past closing quote |
| Inside CJK brackets `「」` `『』` | Jump past closing bracket |
| Inside **bold**, *italic*, `code`, ~~strike~~ | Jump after the formatting |
| Inside a link | Jump after the link |
| In a table cell | Move to next cell |
| In a list item | Indent the item |

## Bracket & Quote Escape

When your cursor is right before a closing bracket or quote, pressing Tab jumps over it instead of inserting spaces.

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

In WYSIWYG mode, Tab can escape from inline formatting marks.

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

### Link Escape

Tab also escapes from links:

```
Check out [VMark|](https://vmark.app)
               ↑ cursor inside link text
```

Press **Tab**:

```
Check out [VMark](https://vmark.app)| and...
                                    ↑ cursor after link
```

## Link Navigation (Source Mode)

In Source mode, Tab provides smart navigation within Markdown link syntax.

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

| Feature | WYSIWYG | Source |
|---------|---------|--------|
| Bracket escape | ✓ | ✓ |
| CJK bracket escape | ✓ | ✓ |
| Curly quote escape | ✓ | ✓ |
| Mark escape (bold, etc.) | ✓ | N/A |
| Link escape | ✓ | ✓ |
| Markdown char escape (`*`, `_`) | N/A | ✓ |
| Table navigation | ✓ | N/A |
| List indentation | ✓ | ✓ |

## Tips

1. **Muscle memory** — Once you get used to Tab escape, you'll find yourself navigating much faster without arrow keys.

2. **Works with auto-pair** — When you type `(`, VMark auto-inserts `)`. After typing inside, just Tab to jump out.

3. **Nested structures** — Tab escapes one level at a time. For `((nested))`, you need two Tabs to fully exit.

4. **Shift + Tab** — In tables and lists, Shift + Tab moves backward or outdents. In other contexts, it removes leading spaces.
