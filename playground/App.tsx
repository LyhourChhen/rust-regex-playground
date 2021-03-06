import Heading from "evergreen-ui/commonjs/typography/src/Heading.js";
import Code from "evergreen-ui/commonjs/typography/src/Code.js";
import SegmentedControl from "evergreen-ui/commonjs/segmented-control/src/SegmentedControl.js";
import Alert from "evergreen-ui/commonjs/alert/src/Alert.js";
import Spinner from "evergreen-ui/commonjs/spinner/src/Spinner.js";
import Pane from "evergreen-ui/commonjs/layers/src/Pane.js";
import * as React from "react";
import { IState, Method, fontInput } from "./common";
import TextInput from "./form/TextInput";
import Theme from "./theme";
import Store from "./store";
import { RRegExp } from "./rregex";
import ViewMatch from "./rust/ViewMatch";
import ViewReplace from "./rust/ViewReplace";
import ViewSyntax from "./rust/ViewSyntax";
import Documentation from "./rust/Documentation";
import TopBar from "./layout/TopBar";
import MenuItem from "./layout/MenuItem";

export interface IAppProps
  extends React.HTMLAttributes<HTMLDivElement>,
    React.HTMLProps<HTMLDivElement> {
  store: Store<IState>;
}

export interface IRRegexResult {
  regexExpressionError?: Error;
  replaceExpressionError?: Error;
  syntaxResult?: any;
  findResult?: any;
  replaceResult?: string;
}

export default function App({ store }: IAppProps) {
  function handleChangeProp(propName: string) {
    return function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      store.dispatch({ [propName]: e.target.value });
    };
  }

  const theme = React.useContext(Theme);
  const result = React.useMemo((): IRRegexResult => {
    if (!(store.value.features && store.value.features.rregex)) return {};

    let regex: RRegExp;
    try {
      regex = new RRegExp(store.value.regex || "");
    } catch (err) {
      return { regexExpressionError: err };
    }

    switch (store.value.method) {
      case Method.syntax:
        return { syntaxResult: regex.syntax() };

      case Method.find:
        const findResult = regex.find_all(store.value.text || "");
        return { findResult };

      case Method.replace:
        if (!store.value.replace) {
          return { replaceResult: store.value.text || "" };
        }

        try {
          return {
            replaceResult: regex.replace_all(
              store.value.text || "",
              store.value.replace || ""
            )
          };
        } catch (err) {
          return { replaceExpressionError: err };
        }

      default:
        return {};
    }
  }, [
    store.value.features && store.value.features.rregex,
    store.value.method,
    store.value.regex,
    store.value.replace,
    store.value.text
  ]);

  const { docRegex, docRegexSyntax } = React.useMemo(() => {
    return {
      docRegex: Documentation.fromPackage(
        "regex",
        (store.value.versions && store.value.versions.regex) || ""
      ),
      docRegexSyntax: Documentation.fromPackage(
        "regex-syntax",
        (store.value.versions && store.value.versions.regex_syntax) || ""
      )
    };
  }, [
    store.value.versions && store.value.versions.regex,
    store.value.versions && store.value.versions.regex_syntax
  ]);

  const completed = !!(store.value.features && store.value.features.completed);
  const rregex = !!(store.value.features && store.value.features.rregex);
  const rregexError = store.value.features && store.value.features.rregexError;

  return (
    <Pane display="flex">
      <TopBar title="RUST REGEX PLAYGROUND">
        <MenuItem href={docRegex.getHomeUrl()} iconAfter="book">
          RUST-REGEX
        </MenuItem>
        <MenuItem href={docRegexSyntax.getHomeUrl()} iconAfter="book">
          RUST-REGEX-SYNTAX
        </MenuItem>
        <MenuItem
          href="https://github.com/2fd/rust-regex-playground"
          iconAfter="github"
        >
          PLAYGROUND
        </MenuItem>
      </TopBar>
      <Pane
        width="50%"
        height="100vh"
        paddingX="3rem"
        paddingTop="5rem"
        paddingBottom=".5rem"
        background="blueTint"
        borderRight
        overflow="auto"
      >
        <Pane width="100%" display="flex" justifyContent="flex-end">
          <SegmentedControl
            name="method"
            width={280}
            options={[
              {
                label: String(Method.syntax).toUpperCase(),
                value: Method.syntax
              },
              { label: String(Method.find).toUpperCase(), value: Method.find },
              {
                label: String(Method.replace).toUpperCase(),
                value: Method.replace
              }
            ]}
            value={store.value.method || Method.find}
            onChange={(value: Method) => store.dispatch({ method: value })}
          />
        </Pane>
        <Pane marginBottom="1rem">
          <Heading
            is="label"
            size={100}
            style={{
              lineHeight: "1.5rem",
              color: result.regexExpressionError && theme.colors.text.danger
            }}
            flex={1}
          >
            REGULAR EXPRESSION
          </Heading>
          <TextInput
            width="100%"
            isInvalid={!!result.regexExpressionError}
            minRows={store.value.method === Method.syntax ? 10 : 1}
            onChange={handleChangeProp("regex")}
            value={store.value.regex}
          />
        </Pane>
        {store.value.method === Method.replace && (
          <Pane marginBottom="1rem">
            <Heading is="label" size={100} style={{ lineHeight: "1.5rem" }}>
              REPLACE EXPRESSION
            </Heading>
            <TextInput
              width="100%"
              onChange={handleChangeProp("replace")}
              value={store.value.replace}
            />
          </Pane>
        )}
        {(store.value.method === Method.find ||
          store.value.method === Method.replace) && (
          <Pane>
            <Heading is="label" size={100} style={{ lineHeight: "1.5rem" }}>
              TEXT
            </Heading>
            <TextInput
              width="100%"
              minRows={10}
              onChange={handleChangeProp("text")}
              value={store.value.text}
            />
          </Pane>
        )}
      </Pane>
      <Pane
        width="50%"
        height="100vh"
        paddingX=".5rem"
        paddingTop="5rem"
        paddingBottom=".5rem"
        overflow="auto"
      >
        {!completed && (
          <Pane
            width="100%"
            padding="3rem"
            display="flex"
            justifyContent="center"
          >
            <Spinner size={64} />
          </Pane>
        )}

        {completed && !rregex && (
          <Pane width="100%" padding="2rem">
            <Alert intent="danger" title="rust-regex could not be loaded">
              {rregexError && rregexError.message}
            </Alert>
          </Pane>
        )}

        {completed && rregex && result.regexExpressionError && (
          <Pane width="100%" padding="2rem">
            <Alert intent="danger" title="regex parse error:">
              <Code
                size={300}
                appearance="minimal"
                style={{ whiteSpace: "pre", color: theme.colors.text.danger }}
              >
                {result.regexExpressionError.message.slice(
                  result.regexExpressionError.message.indexOf("\n")
                )}
              </Code>
            </Alert>
          </Pane>
        )}

        {completed &&
          rregex &&
          !result.regexExpressionError &&
          (store.value.method === Method.find && (
            <ViewMatch
              size=".75rem"
              padding="2rem"
              value={store.value.text || ""}
              matches={result.findResult}
              doc={docRegex}
            />
          ))}

        {completed &&
          rregex &&
          !result.regexExpressionError &&
          (store.value.method === Method.replace && (
            <ViewReplace
              size=".75rem"
              padding="2rem"
              value={result.replaceResult || ""}
              doc={docRegex}
            />
          ))}

        {completed &&
          rregex &&
          !result.regexExpressionError &&
          (store.value.method === Method.syntax && (
            <ViewSyntax
              size=".75rem"
              padding="2rem"
              value={result.syntaxResult}
              doc={docRegexSyntax}
            />
          ))}
      </Pane>
    </Pane>
  );
}
