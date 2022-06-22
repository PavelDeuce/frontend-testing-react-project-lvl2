/* eslint-disable import/no-extraneous-dependencies */
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import _ from 'lodash';

const prefix = 'http://localhost/api/v1';
export const createPath = (...paths) => [prefix, ...paths].join('/');

const runServer = (initialState) => {
  let { tasks, lists } = initialState;

  const handlers = [
    rest.post(createPath('lists'), (req, res, ctx) => {
      const mockedList = {
        id: 2 + _.uniqueId(),
        name: req.body.name,
        removable: true,
      };
      lists.push(mockedList);
      ctx.delay();
      return res(ctx.json(mockedList));
    }),
    rest.delete(createPath('lists', ':id'), (req, res, ctx) => {
      lists = lists.filter((list) => list.id !== req.params.id);
      tasks = tasks.filter((task) => task.listId !== req.params.id);
      ctx.delay();
      return res(ctx.status(204));
    }),
    rest.post(createPath('lists', ':id', 'tasks'), (req, res, ctx) => {
      const mockedTask = {
        completed: false,
        id: 3 + Number(_.uniqueId()),
        listId: Number(req.params.id),
        text: req.body.text,
        touched: 1655371223931,
      };
      tasks.push(mockedTask);
      ctx.delay();
      return res(ctx.json(mockedTask));
    }),
    rest.patch(createPath('tasks', ':id'), (req, res, ctx) => {
      const foundedTask = tasks.find((task) => task.id === Number(req.params.id));
      const updatedTask = { ...foundedTask, completed: req.body.completed };
      tasks = tasks.filter((task) => task.id !== foundedTask);
      tasks.push(updatedTask);
      ctx.delay();
      return res(ctx.json(updatedTask));
    }),
    rest.delete(createPath('tasks', ':id'), (req, res, ctx) => {
      tasks = tasks.filter((task) => task.id !== req.params.id);
      ctx.delay();
      return res(ctx.status(204));
    }),
  ];

  return setupServer(...handlers);
};

export default runServer;
