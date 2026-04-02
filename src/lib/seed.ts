import { createClient } from './supabase/client'

const flow1Steps = [
  {
    order_index: 0,
    title: 'Scaffold the project',
    instruction: 'Create a new React project with Vite and TypeScript, set up the folder structure, and configure Tailwind CSS for styling.',
    prompt_text: `You are an expert React developer. I need you to help me scaffold a brand new React project using Vite with TypeScript. The project is a Todo application called "MyTodos". Please provide the following in order: First, the exact terminal commands to create the project using the Vite scaffolding tool, selecting the React and TypeScript template. Second, the complete folder structure I should have after setup — include a src/components folder, a src/hooks folder, and a src/types folder, and tell me which files to create in each. Third, give me the complete contents of an updated App.tsx file that renders a page with the heading "My Todos" centred on screen, using a wrapper div with basic Tailwind classes for layout. Fourth, give me the updated index.css file that includes the three Tailwind CSS directives at the top. Fifth, give me the tailwind.config.ts file with the content array configured to scan all tsx and ts files in the src directory. I am using Node 20 and npm.`,
    expected_outcome: 'A working Vite React TypeScript project with Tailwind CSS configured and a basic App.tsx that displays "My Todos" heading.',
    example_output: null
  },
  {
    order_index: 1,
    title: 'Build the TodoItem component',
    instruction: 'Create a reusable TodoItem component with TypeScript interfaces, checkbox toggle, delete button, and strikethrough styling for completed items.',
    prompt_text: `You are an expert React and TypeScript developer. I need you to generate a fully typed TodoItem React component for a Todo application. The component file should be at src/components/TodoItem.tsx. First, export a TypeScript interface called Todo with these exact fields: id as string, label as string, completed as boolean, createdAt as Date. Second, create the TodoItem component that accepts these props: id as string, label as string, completed as boolean, onComplete as a function that receives id as string and returns void, onDelete as a function that receives id as string and returns void. The component renders a horizontal row containing a checkbox on the left, the label text in the middle, and a delete button on the right. When the completed prop is true, apply a line-through text decoration to the label. The checkbox onChange event should call onComplete with the item id. The delete button onClick should call onDelete with the item id. Use Tailwind CSS classes for all styling. Add a hover background on the row. Export the component as a named export. Do not use any external libraries.`,
    expected_outcome: 'A TodoItem.tsx file with proper TypeScript interfaces and a working component that displays a todo item with checkbox and delete functionality.',
    example_output: null
  },
  {
    order_index: 2,
    title: 'Build the TodoList component',
    instruction: 'Create a TodoList component that renders multiple TodoItem components and displays an empty state when there are no todos.',
    prompt_text: `You are an expert React and TypeScript developer. I need you to build a TodoList component for my Todo application. The file should be at src/components/TodoList.tsx. Import the Todo interface and TodoItem component from TodoItem.tsx. The TodoList component accepts these props: items as an array of Todo objects, onComplete as a function receiving id string returning void, onDelete as a function receiving id string returning void. The component should render a ul element as the outer container using Tailwind flex-col layout with a gap between items. Map over the items array and render one TodoItem component per item, passing through all props correctly including id, label, completed, onComplete, and onDelete. If the items array is empty or has length zero, instead of rendering the list render an empty state: a centred div with a muted grey message saying "You are all caught up." with a smaller subtext below it saying "Add a task above to get started." Style the empty state with Tailwind, using a light grey text colour, centred alignment, and some vertical padding. Export the component as a named export.`,
    expected_outcome: 'A TodoList.tsx component that renders a list of todos or an empty state message when no todos exist.',
    example_output: null
  },
  {
    order_index: 3,
    title: 'Build the useLocalStorage hook',
    instruction: 'Create a custom React hook that syncs state with localStorage, including error handling for JSON parsing and localStorage availability.',
    prompt_text: `You are an expert TypeScript developer specialising in React hooks. I need you to write a fully generic typed custom React hook called useLocalStorage. The file should be at src/hooks/useLocalStorage.ts. The hook signature must be exactly: useLocalStorage followed by a generic type parameter T, accepting two arguments — key as string and initialValue as T — and returning a tuple of T and a setter function that accepts T and returns void. The hook implementation must do the following: On initialisation, attempt to read from localStorage using the provided key. If the key exists in localStorage, parse the stored JSON string and return it as the initial state value. If the key does not exist, use the initialValue as the initial state. If localStorage is not available or JSON parsing throws an error, catch the error silently and fall back to initialValue. The setter function must both update the React state using useState and write the new value to localStorage as a JSON string. Handle localStorage write errors silently with try-catch. Export the hook as a named export. Use strict TypeScript throughout with no use of the any type.`,
    expected_outcome: 'A useLocalStorage.ts hook file with generic TypeScript types that persists state to localStorage.',
    example_output: null
  },
  {
    order_index: 4,
    title: 'Wire up state management',
    instruction: 'Update App.tsx to integrate all components, manage todo state with useLocalStorage, and implement add, complete, and delete handlers.',
    prompt_text: `You are an expert React and TypeScript developer. I need you to update the main App.tsx file to wire together all the components and hooks we have built for the Todo application. Import the useLocalStorage hook from src/hooks/useLocalStorage. Import the TodoList component from src/components/TodoList. Import the Todo interface from src/components/TodoItem. Use the useLocalStorage hook with the storage key "conduit-todos" and an initial value of an empty array typed as Todo array. Create a controlled text input using useState for the new todo label. Create an addTodo handler that when called creates a new Todo object with id set to crypto.randomUUID(), label set to the trimmed input value, completed set to false, and createdAt set to new Date(), then adds it to the todos array and clears the input. Create an onComplete handler that maps over todos and toggles the completed boolean where the id matches. Create an onDelete handler that filters out the todo where the id matches. Render a centred page layout with a heading, the text input and an Add button in a horizontal row, and the TodoList component below. Add a small count below the list showing how many todos are completed out of the total. Style everything with Tailwind CSS.`,
    expected_outcome: 'A fully functional App.tsx that integrates all components and allows adding, completing, and deleting todos with localStorage persistence.',
    example_output: null
  },
  {
    order_index: 5,
    title: 'Add empty state and polish',
    instruction: 'Add loading skeleton, completion counter with color feedback, and a clear completed button for the final polish.',
    prompt_text: `You are an expert React developer and UI designer. I need you to add final polish and extra features to the Todo app we have built. Make all of the following changes in one response. First, add a loading skeleton: when the component first mounts, show a skeleton placeholder UI for 400 milliseconds before rendering the real list. The skeleton should display three placeholder rows styled as grey rounded bars using Tailwind's animate-pulse class. Use a useEffect with a setTimeout to control this. Second, add a completion counter below the TodoList that reads "X of Y completed" where X is the count of todos where completed is true and Y is the total todo count. When all todos are complete and the list is not empty, change the counter text colour to the Tailwind green-600 class. Third, add a "Clear completed" button that only appears when at least one todo has completed set to true. Clicking this button should filter the todos array to remove all items where completed is true and save the result using the useLocalStorage setter. Style the button with a small muted appearance using Tailwind.`,
    expected_outcome: 'A polished Todo app with loading skeleton, completion counter, and clear completed functionality.',
    example_output: null
  }
]

const flow2Steps = [
  {
    order_index: 0,
    title: 'Analyse and plan',
    instruction: 'Analyze the CSV data quality issues and create a plan for the cleaning operations in the correct order.',
    prompt_text: `You are an expert Python data engineer with deep experience in pandas and data quality. I need you to help me plan a CSV data cleaning script. My CSV file has the following known issues: some text columns have inconsistent casing with values like "NEW YORK" and "new york" mixed together, some numeric columns contain values stored as strings with currency symbols and commas like "$1,200.00" or "1.200,00", some rows have missing values represented as empty strings, the literal string "N/A", or the literal string "null" rather than proper NaN values, some date columns have mixed format strings like "01/12/2024" in some rows and "2024-12-01" in others, and there are likely duplicate rows present. Based on these issues, produce the following: a numbered list of all cleaning operations needed in the correct order of execution, for each operation give it a short function name, a one-sentence description, and the primary pandas method or approach that will be used to implement it, and finally a brief explanation of why order matters for these operations. Format your response clearly with each operation on its own section.`,
    expected_outcome: 'A clear plan document listing all cleaning operations in order with function names, descriptions, and pandas methods.',
    example_output: null
  },
  {
    order_index: 1,
    title: 'Generate cleaning functions',
    instruction: 'Write five individual Python cleaning functions for text standardization, numeric parsing, missing value normalization, date standardization, and duplicate removal.',
    prompt_text: `You are an expert Python developer specialising in pandas data manipulation and data quality engineering. I need you to write five individual Python cleaning functions, each accepting a pandas DataFrame as input and returning a cleaned DataFrame. Write all five in a single file called cleaning.py. Function one: standardise_text_columns that accepts df and returns df, converting every column with dtype object to lowercase using str.lower and stripping leading and trailing whitespace using str.strip. Function two: parse_numeric_columns that accepts df and a list of column name strings called columns, iterating over each column name and using pd.to_numeric with errors set to coerce after first removing any dollar signs, euro signs, pound signs, and commas from the string values. Function three: normalise_missing_values that accepts df and replaces empty strings, the string N/A, and the string null with numpy NaN across the entire DataFrame using replace. Function four: standardise_dates that accepts df and a list of column name strings called columns, using pd.to_datetime on each column with infer_datetime_format set to True and errors set to coerce. Function five: remove_duplicates that accepts df, calls drop_duplicates, and resets the index with drop set to True. Each function must have a docstring and use type hints. Import only pandas and numpy at the top.`,
    expected_outcome: 'A cleaning.py file with five well-documented functions for standardizing text, parsing numbers, normalizing missing values, standardizing dates, and removing duplicates.',
    example_output: null
  },
  {
    order_index: 2,
    title: 'Write the pipeline',
    instruction: 'Create a pipeline.py file that orchestrates all cleaning functions in the correct order and returns a summary of changes.',
    prompt_text: `You are an expert Python developer. I have five CSV cleaning functions written in cleaning.py and I need you to compose them into a main pipeline function in a new file called pipeline.py. Write a function called clean_csv that accepts four arguments: input_path as a string, output_path as a string, numeric_columns as a list of strings with a default of an empty list, and date_columns as a list of strings with a default of an empty list. The function should have a return type of a dictionary with string keys and values that are either integers or lists of strings. Inside the function, read the CSV from input_path using pandas read_csv and store the row count before cleaning. Then call each cleaning function in this exact order: normalise_missing_values first, then standardise_text_columns, then parse_numeric_columns passing the numeric_columns argument, then standardise_dates passing the date_columns argument, then remove_duplicates last. After all cleaning is done, write the cleaned DataFrame to output_path using to_csv with index set to False. Return a dictionary with keys rows_before, rows_after, rows_removed calculated as the difference, and columns_processed as a list of all numeric and date column names that were processed. Add a module-level docstring describing the pipeline.`,
    expected_outcome: 'A pipeline.py file with a clean_csv function that orchestrates all cleaning steps and returns a summary dictionary.',
    example_output: null
  },
  {
    order_index: 3,
    title: 'Add CLI',
    instruction: 'Add a command-line interface using argparse to make the script runnable from the terminal with configurable options.',
    prompt_text: `You are an expert Python developer. I have a CSV cleaning pipeline function in pipeline.py and I need you to add a command-line interface to it so it can be run directly from the terminal. Add a main function at the bottom of pipeline.py that sets up an argument parser using the argparse standard library module. Set the program description to "CSV Data Cleaner — cleans and normalises CSV files". Add the following arguments: --input as a required string argument with help text "path to the input CSV file", --output as a required string argument with help text "path for the cleaned output CSV file", --numeric-columns as an optional argument using nargs set to + so it accepts multiple values with a default of an empty list and help text "column names to parse as numeric values", --date-columns as an optional argument also using nargs set to + with a default of an empty list and help text "column names to parse as dates". After parsing, call the clean_csv function with the parsed arguments and store the returned summary dictionary. Print the summary to the terminal in a readable format using an f-string that shows each key and value on its own line with a clear label. Wrap the main function call in the standard if __name__ equals "__main__" guard.`,
    expected_outcome: 'An updated pipeline.py with a CLI interface that accepts --input, --output, --numeric-columns, and --date-columns arguments.',
    example_output: null
  },
  {
    order_index: 4,
    title: 'Add error handling',
    instruction: 'Add comprehensive error handling and logging for file operations, parsing errors, and unexpected exceptions.',
    prompt_text: `You are an expert Python developer focused on production-quality code. I have a working CSV cleaning CLI script and I need you to add professional error handling and logging throughout it. Make the following specific changes to pipeline.py. At the top of the file, import the logging standard library module and configure it with basicConfig using a format string that includes the timestamp, the log level name, and the message, and set the default level to INFO. In the clean_csv function, add a logging.info call at the very start that logs the input and output file paths. Add a logging.info call after each of the five cleaning steps that logs the step name and the current number of rows in the DataFrame. Add a logging.info call at the end that logs the full summary dictionary. Wrap the pd.read_csv call in a try and except block catching FileNotFoundError — log an error message with the missing path and raise SystemExit with code 1. Also catch pandas errors.ParserError — log an error describing the parse failure and raise SystemExit with code 1. Wrap the to_csv call in a try and except catching PermissionError — log an error explaining the file cannot be written and raise SystemExit with code 1. In the main function, wrap the entire clean_csv call in a broad try and except Exception catching any unexpected error — log it at ERROR level and raise SystemExit with code 1.`,
    expected_outcome: 'A robust pipeline.py with comprehensive logging and error handling for all file operations and edge cases.',
    example_output: null
  }
]

const flow3Steps = [
  {
    order_index: 0,
    title: 'Design the data flow',
    instruction: 'Create a design document mapping webhook fields to Notion properties and identifying required transformations.',
    prompt_text: `You are an expert automation architect with deep experience in n8n and the Notion API. I need you to help me design a complete data transformation flow from an incoming webhook payload to a new Notion database page. My webhook will receive POST requests with this exact JSON structure: an id field as a string, a title field as a string, a submitter_email field as a string, a priority field that is one of the string values low, medium, or high, a description field as a string, and a submitted_at field as an ISO 8601 timestamp string. My Notion database has the following properties already configured: a Name property of type title, an Email property of type email, a Priority property of type select with options Low, Medium, and High with capital first letters, a Notes property of type rich text, a Submitted property of type date, and a Source ID property of type rich text. Please produce a complete design document containing: a field mapping table showing each webhook field, its transformation rule if any, and the target Notion property name and type, a description of any data transformations required such as capitalising the priority value or reformatting the date, a description of the three-node n8n workflow sequence I will build, and a list of potential error cases I should handle in the function node.`,
    expected_outcome: 'A design document with field mapping table, transformation rules, workflow sequence description, and error handling considerations.',
    example_output: null
  },
  {
    order_index: 1,
    title: 'Configure the webhook node',
    instruction: 'Set up the n8n Webhook trigger node with the correct HTTP method, response mode, and test it with curl.',
    prompt_text: `You are an expert n8n workflow developer. I need you to give me the complete and exact configuration for an n8n Webhook trigger node that will receive JSON POST requests from a form submission system. Provide the following information in full. First, the exact JSON configuration object for the n8n Webhook node as it would appear in the workflow JSON export — include the node type, the httpMethod set to POST, the responseMode set to onReceived, the responseData set to firstEntryJson, and a path value set to form-submissions. Second, write the complete curl command I should use from my terminal to send a test POST request to the local n8n test webhook URL, with a sample JSON body containing realistic values for all six fields: id, title, submitter_email, priority, description, and submitted_at. Third, explain the steps to activate the webhook in n8n — the difference between the test URL and the production URL and when to use each. Fourth, show me the exact n8n expression syntax I will use in the next node to access each field from the webhook body, for example how to access the title field, the priority field, and the submitted_at field using the dollar sign json dot notation.`,
    expected_outcome: 'Complete webhook configuration JSON, test curl command, activation instructions, and expression syntax examples.',
    example_output: null
  },
  {
    order_index: 2,
    title: 'Write the transformation function',
    instruction: 'Write the JavaScript code for the n8n Function node that transforms webhook data into the Notion API format.',
    prompt_text: `You are an expert n8n developer and JavaScript programmer with experience writing n8n Function node code. I need you to write the complete JavaScript code for an n8n Function node that transforms the incoming webhook payload into the exact structure expected by the Notion API node that follows it. The input data is available from the previous Webhook node. Write code that does the following in order. First, extract all six fields from the input using $input.first().json.body — the fields are id, title, submitter_email, priority, description, and submitted_at. Second, transform the priority string so that "low" becomes "Low", "medium" becomes "Medium", and "high" becomes "High" — handle any other unexpected string values by defaulting to "Low". Third, parse the submitted_at ISO timestamp string and convert it to a date-only string in the format YYYY-MM-DD that the Notion date property expects. Fourth, construct a result object with these keys: notionTitle set to the title value, notionEmail set to the submitter_email value, notionPriority set to the transformed priority, notionNotes set to the description value, notionDate set to the formatted date string, notionSourceId set to the id value. Fifth, wrap the entire logic in a try and catch block — if any error occurs log it and return an array containing an object with json set to an object with an error key containing the error message string. Return the success result as return followed by an array containing an object with json set to the result object.`,
    expected_outcome: 'A complete JavaScript function for the n8n Function node that transforms webhook data to Notion format with error handling.',
    example_output: null
  },
  {
    order_index: 3,
    title: 'Configure the Notion node',
    instruction: 'Set up the n8n Notion node to create database pages with proper property mappings and authentication.',
    prompt_text: `You are an expert n8n developer and Notion API specialist. I need you to give me the complete configuration for an n8n Notion node that creates a new page in an existing Notion database using data from the preceding Function node. Provide all of the following. First, the exact resource and operation settings to select in the n8n Notion node — the resource should be Database Page and the operation should be Create. Second, explain exactly where to find the Notion database ID — describe how to open the database as a full page in Notion, what the URL looks like, and which part of the URL is the database ID, including how to handle the URL format when the workspace name is included. Third, provide the complete properties mapping for each of the six Notion properties — for the Name title property show how to map it to the notionTitle expression, for the Email property show the expression, for the Priority select property show how to use the notionPriority expression as the select option value, for the Notes rich text property show the expression, for the Submitted date property show the expression using notionDate, and for the Source ID rich text property show the expression. Fourth, describe the exact steps to create a Notion internal integration, find the integration token, and add the integration to the specific database. Fifth, describe how to run the complete three-node workflow end to end using the test webhook URL and verify the Notion page was created correctly.`,
    expected_outcome: 'Complete Notion node configuration with property mappings, database ID instructions, and integration setup steps.',
    example_output: null
  }
]

export const seedFlows = async () => {
  const supabase = createClient()

  const flows = [
    {
      title: 'Build a React Todo App with localStorage',
      description: 'Create a fully functional Todo application with React, TypeScript, and Vite. Features include adding, completing, and deleting todos with localStorage persistence.',
      category: 'React',
      estimated_minutes: 45,
      status: 'verified' as const,
      safety_status: 'safe' as const,
      steps: flow1Steps
    },
    {
      title: 'Write a Python CSV Data Cleaner',
      description: 'Build a command-line tool that cleans and normalizes CSV files. Handles text standardization, numeric parsing, missing values, dates, and duplicate removal.',
      category: 'Python',
      estimated_minutes: 25,
      status: 'unverified' as const,
      safety_status: 'safe' as const,
      steps: flow2Steps
    },
    {
      title: 'Build an n8n Webhook to Notion Automation',
      description: 'Create a three-node n8n workflow that receives webhook data, transforms it, and creates pages in a Notion database automatically.',
      category: 'Automation',
      estimated_minutes: 20,
      status: 'pending' as const,
      safety_status: 'caution' as const,
      steps: flow3Steps
    }
  ]

  for (const flow of flows) {
    const { data: existing } = await supabase
      .from('flows')
      .select('id')
      .eq('title', flow.title)
      .single()

    if (existing) {
      console.log(`Flow "${flow.title}" already exists, skipping...`)
      continue
    }

    const { steps, ...flowData } = flow
    const { data: flowRecord, error: flowError } = await supabase
      .from('flows')
      .insert(flowData)
      .select()
      .single()

    if (flowError) {
      console.error(`Error creating flow "${flow.title}":`, flowError)
      continue
    }

    const stepsWithFlowId = steps.map(step => ({
      ...step,
      flow_id: flowRecord.id
    }))

    const { error: stepsError } = await supabase
      .from('steps')
      .insert(stepsWithFlowId)

    if (stepsError) {
      console.error(`Error creating steps for "${flow.title}":`, stepsError)
    } else {
      console.log(`Created flow "${flow.title}" with ${steps.length} steps`)
    }
  }
}