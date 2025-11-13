import React from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';

export type InputBarProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

export const InputBar: React.FC<InputBarProps> = ({ value, onChange, onSubmit, placeholder }) => {
  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text color="cyan">❯ </Text>
      <TextInput
        value={value}
        placeholder={placeholder ?? 'Ask TermiMind...'}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </Box>
  );
};
