'use client';

import { useId, type ReactNode } from 'react';
import { NumberField } from '@base-ui/react/number-field';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  OutlinedInput,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

type Size = 'small' | 'medium';

type NumberSpinnerProps = NumberField.Root.Props & {
  label?: ReactNode;
  helperText?: ReactNode;
  size?: Size;
  error?: boolean;
  fullWidth?: boolean;
};

/**
 * Base UI NumberField を MUI のコンポーネントで包んだ数値入力スピナー。
 * 左右の -/+ ボタンと、ラベルをドラッグして値を調整する ScrubArea を持つ。
 */
export default function NumberSpinner({
  id: idProp,
  label,
  helperText,
  error,
  size = 'medium',
  fullWidth,
  ...rootProps
}: NumberSpinnerProps) {
  const reactId = useId();
  const id = idProp ?? reactId;

  return (
    <NumberField.Root
      {...rootProps}
      id={id}
      render={(controlProps, state) => (
        <FormControl
          ref={controlProps.ref}
          size={size}
          disabled={state.disabled}
          required={state.required}
          error={error}
          fullWidth={fullWidth}
          variant="outlined"
          sx={{
            '& .MuiButton-root': {
              borderColor: 'divider',
              minWidth: 0,
              bgcolor: 'action.hover',
              '&:not(.Mui-disabled)': {
                color: 'text.primary',
              },
            },
          }}
        >
          {controlProps.children}
        </FormControl>
      )}
    >
      {label !== undefined && (
        <NumberField.ScrubArea
          render={
            <Box
              component="span"
              sx={{ userSelect: 'none', width: 'max-content' }}
            />
          }
        >
          <FormLabel
            htmlFor={id}
            sx={{
              display: 'inline-block',
              cursor: 'ew-resize',
              fontSize: '0.875rem',
              color: 'text.primary',
              fontWeight: 500,
              lineHeight: 1.5,
              mb: 0.5,
            }}
          >
            {label}
          </FormLabel>
          <NumberField.ScrubAreaCursor>
            <OpenInFullIcon
              fontSize="small"
              sx={{ transform: 'translateY(12.5%) rotate(45deg)' }}
            />
          </NumberField.ScrubAreaCursor>
        </NumberField.ScrubArea>
      )}

      <Box sx={{ display: 'flex' }}>
        <NumberField.Decrement
          render={
            <Button
              variant="outlined"
              aria-label="減らす"
              size={size}
              sx={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                borderRight: 0,
                '&.Mui-disabled': { borderRight: 0 },
              }}
            />
          }
        >
          <RemoveIcon fontSize={size} />
        </NumberField.Decrement>

        <NumberField.Input
          id={id}
          render={(inputProps, inputState) => (
            <OutlinedInput
              inputRef={inputProps.ref}
              value={inputState.inputValue}
              onBlur={inputProps.onBlur}
              onChange={inputProps.onChange}
              onFocus={inputProps.onFocus}
              onKeyDown={inputProps.onKeyDown}
              onKeyUp={inputProps.onKeyUp}
              slotProps={{
                input: {
                  ...inputProps,
                  sx: { textAlign: 'center' },
                },
              }}
              sx={{ pr: 0, borderRadius: 0, flex: 1 }}
            />
          )}
        />

        <NumberField.Increment
          render={
            <Button
              variant="outlined"
              aria-label="増やす"
              size={size}
              sx={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderLeft: 0,
                '&.Mui-disabled': { borderLeft: 0 },
              }}
            />
          }
        >
          <AddIcon fontSize={size} />
        </NumberField.Increment>
      </Box>

      {helperText !== undefined && helperText !== '' && (
        <FormHelperText error={error} sx={{ mx: 0, mt: 0.5 }}>
          {helperText}
        </FormHelperText>
      )}
    </NumberField.Root>
  );
}
