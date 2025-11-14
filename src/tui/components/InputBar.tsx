import React from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';

const isPromise = (candidate: boolean | Promise<boolean>): candidate is Promise<boolean> => {
  if (typeof candidate !== 'object' || candidate === null) {
    return false;
  }

  return 'then' in candidate && typeof (candidate as Promise<boolean>).then === 'function';
};

export type InputBarProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => boolean | Promise<boolean>;
};

type ControlledTextInputProps = React.ComponentProps<typeof TextInput> & { value?: string };

const ControlledTextInput = TextInput as unknown as React.FC<ControlledTextInputProps>;

export const InputBar: React.FC<InputBarProps> = ({ value, onChange, onSubmit, placeholder }) => {
  const handleSubmit = React.useCallback(
    (submitted: string) => {
      const result = onSubmit(submitted);
      if (isPromise(result)) {
        result
          .then((shouldClear) => {
            if (shouldClear !== false) {
              onChange('');
            }
          })
          .catch(() => {
            // Swallow promise rejections; submission errors are surfaced elsewhere.
          });
        return;
      }

      if (result !== false) {
        onChange('');
      }
    },
    [onChange, onSubmit]
  );

  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text color="cyan">❯ </Text>
      <ControlledTextInput
        value={value}
        placeholder={placeholder ?? 'Ask ASIA...'}
        onChange={onChange}
        onSubmit={handleSubmit}
      />
    </Box>
  );
};
