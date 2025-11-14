import React from 'react';
import { Box, Text } from 'ink';
import type { SlashCommand } from '../slash-commands/types.js';

type CommandPaletteProps = {
  commands: SlashCommand[];
  selectedIndex: number;
  query: string;
};

/**
 * Memoized command palette - only re-renders when commands array length,
 * selectedIndex, or query changes. Prevents re-renders on every keystroke.
 */
export const CommandPalette = React.memo<CommandPaletteProps>(({ commands, selectedIndex, query }) => {
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
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if commands count, selectedIndex, or query changes
  return (
    prevProps.commands.length === nextProps.commands.length &&
    prevProps.selectedIndex === nextProps.selectedIndex &&
    prevProps.query === nextProps.query
  );
});

CommandPalette.displayName = 'CommandPalette';
