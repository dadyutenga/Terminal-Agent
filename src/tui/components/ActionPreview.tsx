import React from 'react';
import { Box, Text } from 'ink';

interface ActionPreviewProps {
  preview: string;
  showBorder?: boolean;
}

/**
 * Component to display action preview before execution
 */
export const ActionPreview: React.FC<ActionPreviewProps> = ({
  preview,
  showBorder = true,
}) => {
  return (
    <Box flexDirection="column" paddingX={1}>
      {showBorder && (
        <Text color="cyan">{'═'.repeat(60)}</Text>
      )}
      <Text>{preview}</Text>
      {showBorder && (
        <Text color="cyan">{'═'.repeat(60)}</Text>
      )}
    </Box>
  );
};
