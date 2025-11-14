import React from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';

const isPromise = (candidate: void | Promise<void>): candidate is Promise<void> => {
  if (typeof candidate !== 'object' || candidate === null || candidate === undefined) {
    return false;
  }

  return 'then' in candidate && typeof (candidate as Promise<void>).then === 'function';
};

export type InputBarProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void | Promise<void>;
};

type ControlledTextInputProps = React.ComponentProps<typeof TextInput> & { value?: string };

const ControlledTextInput = TextInput as unknown as React.FC<ControlledTextInputProps>;

export const InputBar: React.FC<InputBarProps> = ({ value, onChange, onSubmit, placeholder }) => {
  const [submitCount, setSubmitCount] = React.useState(0);
  
  const handleSubmit = React.useCallback(
    (submitted: string) => {
      // Clear the input by incrementing counter to force remount
      setSubmitCount(prev => prev + 1);
      onChange('');
      
      // Then execute the submit handler
      const result = onSubmit(submitted);
      if (isPromise(result)) {
        result.catch(() => {
          // Swallow promise rejections; submission errors are surfaced elsewhere.
        });
      }
    },
    [onChange, onSubmit]
  );

  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text color="cyan">❯ </Text>
      <ControlledTextInput
        key={submitCount}
        value={value}
        placeholder={placeholder ?? 'Ask ASIA...'}
        onChange={onChange}
        onSubmit={handleSubmit}
      />
    </Box>
  );
};
