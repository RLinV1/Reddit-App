/**
 * @jest-environment jsdom
 */
import React from 'react'; 
import { render, fireEvent, screen } from '@testing-library/react';
import Header from './src/components/Header';

describe('Create Post Button Access', () => {
  test('should be disabled for guest users', () => {
    const mockHandler = jest.fn();

    render(<Header user="Guest" handleCreatePostView={mockHandler}/>);
    const button = screen.getByText('Create Post');

    fireEvent.click(button); 
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test('should be enabled for registered users', () => {
    const mockUser = { username: 'registeredUser' };
    const mockHandler = jest.fn();

    render(<Header user={mockUser} handleCreatePostView={mockHandler} />);
    const button = screen.getByText('Create Post');


    fireEvent.click(button);
    expect(mockHandler).toHaveBeenCalled();
  });
});
