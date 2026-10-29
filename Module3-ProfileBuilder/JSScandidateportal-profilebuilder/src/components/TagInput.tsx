import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = 'Type and press Enter or comma...',
  label,
  helperText,
  error,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className={`tag-input-container ${error ? 'has-error' : ''}`}>
        <div className="tag-list">
          {tags.map((tag, idx) => (
            <span key={`${tag}-${idx}`} className="tag-item">
              <span className="tag-text">{tag}</span>
              <button
                type="button"
                className="tag-remove-btn"
                onClick={() => removeTag(idx)}
                aria-label={`Remove ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <div className="tag-input-row">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputValue.trim()) addTag(inputValue);
              }}
              placeholder={tags.length === 0 ? placeholder : 'Add another...'}
              className="tag-native-input"
            />
            {inputValue.trim() && (
              <button
                type="button"
                className="tag-add-btn"
                onClick={() => addTag(inputValue)}
                title="Add tag"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
      {error && <span className="form-error">{error}</span>}
      {helperText && !error && <span className="form-helper">{helperText}</span>}
    </div>
  );
};
