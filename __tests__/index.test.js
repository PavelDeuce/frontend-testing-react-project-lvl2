import initTodoApp from '@hexlet/react-todo-app-with-backend';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import {
  render, screen, within, waitFor,
} from '@testing-library/react';
import runServer, { createPath } from '../mocks';

let virtualDom;
let server;

test('Index', () => {
  virtualDom = initTodoApp({
    currentListId: 1,
    lists: [{ id: 1, name: 'primary', removable: false }],
    tasks: [],
  });
  render(virtualDom);

  expect(screen.getByText('Hexlet Todos')).toBeVisible();
  expect(screen.getByText('Lists')).toBeVisible();
  expect(screen.getByText('Tasks')).toBeVisible();
  expect(screen.getByText('primary')).toBeVisible();
  expect(screen.getByText('Tasks list is empty')).toBeVisible();
  expect(screen.getByRole('button', { name: 'add list' })).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'New list' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Add' })).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'New task' })).toBeVisible();
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
        {
          id: 1,
          listId: 1,
          text: 'Primary Task 1',
          completed: false,
        },
        {
          id: 2,
          listId: 1,
          text: 'Primary Task 2',
          completed: false,
        },
        {
          id: 3,
          listId: 2,
          text: 'Secondary Task 1',
          completed: false,
        },
      ],
    };

    server = runServer(initialState);
    server.listen();

    virtualDom = initTodoApp(initialState);
    render(virtualDom);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('Tasks', () => {
    it('Post', async () => {
      const firstTaskName = 'scud';
      const secondTaskName = 'storm';

      const taskForm = screen.getByTestId('task-form');
      const input = within(taskForm).getByRole('textbox', { name: 'New task' });
      const submit = within(taskForm).getByRole('button', { name: 'Add' });

      userEvent.type(input, 'launched');
      userEvent.click(screen.getByText('Hexlet Todos'));

      await waitFor(() => {
        expect(input).toHaveClass('is-valid');
      });

      userEvent.clear(input);
      userEvent.click(submit);

      await waitFor(() => {
        expect(input).toHaveClass('is-invalid');
        expect(screen.getByText('Required!')).toBeVisible();
      });

      userEvent.type(input, firstTaskName);
      userEvent.click(submit);

      expect(input).toHaveAttribute('readonly');
      expect(submit).toBeDisabled();

      await waitFor(() => {
        const ul = screen.getByTestId('tasks');
        expect(within(ul).getAllByText(firstTaskName)).toHaveLength(1);
        expect(within(ul).getByText(firstTaskName)).toBeInTheDocument();
        expect(input).not.toHaveClass('is-invalid');
        expect(screen.queryByText('Required!')).not.toBeInTheDocument();
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

      expect(within(taskForm).getByText(`${secondTaskName} already exists`)).toBeVisible();
    });

    it('Delete', async () => {
      const ul = screen.getByTestId('tasks');
      const removeButtons = within(ul).getAllByRole('button', { name: 'Remove' });
      const [firstButton, secondButton] = removeButtons;

      expect(within(ul).getAllByRole('listitem')).toHaveLength(2);
      expect(removeButtons).toHaveLength(2);
      expect(within(ul).getByText('Primary Task 1')).toBeInTheDocument();
      expect(within(ul).getByText('Primary Task 2')).toBeInTheDocument();

      userEvent.click(firstButton);
      expect(firstButton).toBeDisabled();

      await waitFor(() => {
        expect(within(ul).queryByText('Primary Task 1')).not.toBeInTheDocument();
        expect(within(ul).getAllByRole('listitem')).toHaveLength(1);
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

    it('Network error', async () => {
      server.use(
        rest.post(createPath('lists', ':id', 'tasks'), (req, res) => res.networkError('Network Error')),
      );

      const taskName = "Diego's Task";

      const taskForm = screen.getByTestId('task-form');
      const input = within(taskForm).getByRole('textbox', { name: 'New task' });
      const submit = within(taskForm).getByRole('button', { name: 'Add' });

      userEvent.type(input, taskName);
      userEvent.click(submit);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeVisible();
      });

      expect(screen.queryByText(taskName)).not.toBeInTheDocument();
    });
  });

  describe('Lists', () => {
    it('Post', async () => {
      const firstListName = 'phoenix';
      const secondListName = 'knight';

      const listForm = screen.getByTestId('list-form');
      const input = within(listForm).getByRole('textbox', { name: 'New list' });
      const submit = within(listForm).getByRole('button', { name: 'add list' });

      expect(input).not.toHaveAttribute('readonly');
      expect(submit).toBeEnabled();

      userEvent.type(input, 'lineage');
      userEvent.click(screen.getByText('Hexlet Todos'));

      await waitFor(() => {
        expect(input).toHaveClass('is-valid');
      });

      userEvent.clear(input);
      userEvent.click(submit);

      await waitFor(() => {
        expect(input).toHaveClass('is-invalid');
        expect(screen.getByText('Required!')).toBeVisible();
      });

      userEvent.type(input, firstListName);
      userEvent.click(submit);

      expect(input).toHaveAttribute('readonly');
      expect(submit).toBeDisabled();

      await waitFor(() => {
        const ul = screen.getByTestId('lists');
        expect(within(ul).getAllByText(firstListName)).toHaveLength(1);
        expect(within(ul).getByText(firstListName)).toBeInTheDocument();
        expect(input).not.toHaveClass('is-invalid');
        expect(screen.queryByText('Required!')).not.toBeInTheDocument();
      });

      userEvent.type(input, secondListName);
      userEvent.click(submit);

      expect(input).toHaveAttribute('readonly');
      expect(submit).toBeDisabled();

      await waitFor(() => {
        const ul = screen.getByTestId('lists');
        expect(within(ul).getAllByText(secondListName)).toHaveLength(1);
        expect(within(ul).getByText(secondListName)).toBeInTheDocument();
      });

      userEvent.type(input, secondListName);
      userEvent.click(submit);

      await waitFor(() => {
        const ul = screen.getByTestId('lists');
        expect(within(ul).getAllByText(secondListName)).toHaveLength(1);
      });

      expect(within(listForm).getByText(`${secondListName} already exists`)).toBeVisible();
    });

    it('Delete', async () => {
      const ul = screen.getByTestId('lists');
      const removeButton = within(ul).getByRole('button', { name: 'remove list' });

      expect(within(ul).getAllByRole('listitem')).toHaveLength(2);
      expect(within(ul).getByText('primary')).toBeInTheDocument();
      expect(within(ul).getByText('secondary')).toBeInTheDocument();

      userEvent.click(removeButton);
      expect(removeButton).toBeDisabled();

      await waitFor(() => {
        expect(within(ul).getAllByRole('listitem')).toHaveLength(1);
        expect(within(ul).queryByText('secondary')).not.toBeInTheDocument();
      });
    });

    it('Network error', async () => {
      server.use(rest.post(createPath('lists'), (req, res) => res.networkError('Network Error')));

      const listName = "Isaac Clarke's List";

      const listForm = screen.getByTestId('list-form');
      const input = within(listForm).getByRole('textbox', { name: 'New list' });
      const submit = within(listForm).getByRole('button', { name: 'add list' });

      userEvent.type(input, listName);
      userEvent.click(submit);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeVisible();
      });

      expect(screen.queryByText(listName)).not.toBeInTheDocument();
    });
  });
});
