In the previous chapter, we learned how a tokenizer works, and how to build a tokenizer that takes an input string, broken it down into a stream of tokens. This is just the beginning of the journey.

For the compiler to be able to make sense of the token stream, we need to convert it into some meaningful data structure. In most compilers, this data structure called an **Abstract Syntax Tree (AST)**. And the conversion is done by a parser.

There are many different approaches to implement a parser, like parser combinator, the shunting yard algorithm,... In this book, we are not going to talk about any of these. Instead, we will go with a much more simpler algorithm called **Recursive Descent**.

# 2.1  What is a Recursive Descent Parser?

**Recursive Descent Parser** is a top-down parser where every _non-terminal_ in the BNF grammar is a subroutine. The parser works by recursively calling each subroutine to construct the parsed output. It’s not the only algorithm to implement a parser, but it’s one of the most simple ones that are very easy to understand and implement.

For example, let’s say we have a grammar to parse money amount in USD, GBP, and EUR. The money amount should be written in the form of `<currency_symbol> <amount>`, like `$100`:

```
money           ::= currency_symbol amount
currency_symbol ::= '$' | '£' | '€'
amount          ::= (0..9)*
```

The grammar has three _non-terminals_: `money`, `currency_symbol`, and `amount`. When implemented, we should also implement three parsing methods: `parse_money()`, `parse_currency_symbol()`, and `parse_amount()`. Each of the parsing methods will call each other just like how they’re related in the grammar rules:

```
type ParseResult<T> = Result<T, ParseError>;

impl<'a> Parser<'a> {
    fn parse_amount(&mut self) -> ParseResult<i32> {
        ...
    }

    fn parse_currency_symbol(&mut self) -> ParseResult<Currency> {
        ...
    }

    fn parse_money(&mut self) -> ParseResult<MoneyNode> {
        let currency = self.parse_currency_symbol()?;
        let amount = self.parse_amount()?;
        return Ok(MoneyNode { currency, amount });
    }
}
```

# 2.2  Implementing a simple parser

Let’s dig deeper into the above example. We will focus on the parser. Let’s assume that we already have a lexer that converts an input string like `"$100"` into a list of tokens.

This is the end of the free preview. Please consider cheering up the author by sending him some coffee cup on Ko-fi. If you came from the WeBuild Community, you know what to do!
