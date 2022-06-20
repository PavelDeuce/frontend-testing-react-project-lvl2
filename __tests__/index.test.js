import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import initTodoApp from '@hexlet/react-todo-app-with-backend';
import runServer from '../mocks';

let virtualDom;
let server;

test('Index', () => {
  virtualDom = initTodoApp({
    currentListId: 1,
    lists: [{ id: 1, name: 'primary', removable: false }],
    tasks: [],
  });
  render(virtualDom);
  expect(screen.getByText('Hexlet Todos')).toBeInTheDocument();
});

describe('Core', () => {
  beforeEach(() => {
    const initialState = {
      currentListId: 1,
      lists: [
        { id: 1, name: 'primary', removable: false },
        { id: 2, name: 'secondary', removable: true },
      ],
      tasks: [
        { id: 1, listId: 1, text: 'Primary Task 1', completed: false },
        { id: 2, listId: 1, text: 'Primary Task 2', completed: false },
        { id: 3, listId: 2, text: 'Secondary Task 1', completed: false },
      ],
    };

    server = runServer(initialState);
    server.listen();
    virtualDom = initTodoApp(initialState);
    render(virtualDom);
  });

  afterEach(() => {
    server.close();
  });

  describe('Tasks', () => {
    it('Post', async () => {
      const firstTaskName = 'First task';
      const secondTaskName = 'Second task';

      const form = screen.getByTestId('task-form');
      const input = within(form).getByRole('textbox');
      const submit = within(form).getByRole('button');

      userEvent.type(input, firstTaskName);
      userEvent.click(submit);

      expect(input).toHaveAttribute('readonly');
      expect(submit).toBeDisabled();

      await waitFor(() => {
        const ul = screen.getByTestId('tasks');
        expect(within(ul).getAllByText(firstTaskName)).toHaveLength(1);
        expect(within(ul).getByText(firstTaskName)).toBeInTheDocument();
      });

      expect(input).not.toHaveAttribute('readonly');
      expect(submit).toBeEnabled();

      userEvent.type(input, secondTaskName);
      userEvent.click(submit);

      expect(input).toHaveAttribute('readonly');
      expect(submit).toBeDisabled();

      await waitFor(() => {
        const ul = screen.getByTestId('tasks');
        expect(within(ul).getAllByText(secondTaskName)).toHaveLength(1);
        expect(within(ul).getByText(secondTaskName)).toBeInTheDocument();
      });

      userEvent.type(input, secondTaskName);
      userEvent.click(submit);

      await waitFor(() => {
        const ul = screen.getByTestId('tasks');
        expect(within(ul).getAllByText(secondTaskName)).toHaveLength(1);
      });

      expect(within(form).getByText(`${secondTaskName} already exists`)).toBeInTheDocument();
    });

    it('Delete', async () => {
      const ul = screen.getByTestId('tasks');
      const removeButtons = within(ul).getAllByRole('button');
      const [firstButton, secondButton] = removeButtons;

      expect(removeButtons).toHaveLength(2);
      expect(within(ul).getByText('Primary Task 1')).toBeInTheDocument();
      expect(within(ul).getByText('Primary Task 2')).toBeInTheDocument();

      userEvent.click(firstButton);
      expect(firstButton).toBeDisabled();

      await waitFor(() => {
        expect(within(ul).queryByText('Primary Task 1')).not.toBeInTheDocument();
      });

      userEvent.click(secondButton);
      expect(secondButton).toBeDisabled();

      await waitFor(() => {
        expect(within(ul).queryByText('Primary Task 2')).not.toBeInTheDocument();
      });
    });

    it('Patch', async () => {
      const ul = screen.getByTestId('tasks');
      const firstTask = screen.getByLabelText('Primary Task 1');
      const secondTask = screen.getByLabelText('Primary Task 2');

      userEvent.click(firstTask);
      expect(firstTask).toBeDisabled();

      await waitFor(() => {
        expect(firstTask).toBeEnabled();
        expect(ul.querySelectorAll('s')).toHaveLength(1);
      });

      expect(firstTask).toBeEnabled();

      userEvent.click(secondTask);
      expect(secondTask).toBeDisabled();

      await waitFor(() => {
        expect(secondTask).toBeEnabled();
        expect(ul.querySelectorAll('s')).toHaveLength(2);
      });

      userEvent.click(firstTask);
      userEvent.click(secondTask);
      expect(firstTask).toBeDisabled();
      expect(secondTask).toBeDisabled();

      await waitFor(() => {
        expect(firstTask).toBeEnabled();
        expect(ul.querySelectorAll('s')).toHaveLength(0);
      });
    });
  });
});
