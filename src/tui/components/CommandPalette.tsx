import React from 'react';
import { Box, Text } from 'ink';
import type { SlashCommand } from '../slash-commands/types.js';

type CommandPaletteProps = {
  commands: SlashCommand[];
  selectedIndex: number;
  query: string;
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ commands, selectedIndex, query }) => {
  const hasCommands = commands.length > 0;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} paddingY={hasCommands ? 1 : 0}>
        {hasCommands ? (
          commands.map((command, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Box key={command.id} flexDirection="column" marginBottom={index < commands.length - 1 ? 1 : 0}>
                <Text color={isSelected ? 'black' : 'cyan'} backgroundColor={isSelected ? 'cyan' : undefined}>
                  {`/${command.name}`}
                </Text>
                <Text color={isSelected ? 'white' : 'gray'}>{command.description}</Text>
              </Box>
            );
          })
        ) : (
          <Text color="gray">No commands match "{query}"</Text>
        )}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Use ↑/↓ to navigate, Tab to autocomplete, Enter to run.</Text>
      </Box>
    </Box>
  );
};
