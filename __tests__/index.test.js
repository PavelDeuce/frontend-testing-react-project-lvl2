import { render, screen } from '@testing-library/react';
import initTodoApp from '@hexlet/react-todo-app-with-backend';

const initialState = {
  currentListId: 1,
  lists: [{ id: 1, name: 'test-list', removable: false }],
  tasks: [],
};

let virtualDom;

beforeEach(() => {
  virtualDom = initTodoApp(initialState);
});

it('should render main-page', () => {
  render(virtualDom);
  expect(screen.getByText('Hexlet Todos')).toBeInTheDocument();
});
