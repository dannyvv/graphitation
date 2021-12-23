import React, { useCallback } from "react";
import {
  useFragment,
  shallowCompareFragmentReferences,
} from "@graphitation/apollo-react-relay-duct-tape";
import { graphql } from "@graphitation/graphql-js-tag";

import useChangeTodoStatusMutation from "./useChangeTodoStatusMutation";

import { Todo_todoFragment$key } from "./__generated__/Todo_todoFragment.graphql";

export const Todo_todoFragment = graphql`
  fragment Todo_todoFragment on Todo {
    id
    description
    isCompleted
  }
`;

const Todo: React.FC<{ todo: Todo_todoFragment$key }> = ({ todo: todoRef }) => {
  const todo = useFragment(Todo_todoFragment, todoRef);
  console.log("Todo watch data:", todo);

  const [changeTodoStatus] = useChangeTodoStatusMutation();
  const handleCompleteChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const isCompleted = e.currentTarget.checked;
      changeTodoStatus({ id: todo.id, isCompleted });
    },
    [changeTodoStatus]
  );

  return (
    <>
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={todo.isCompleted}
          onChange={handleCompleteChange}
        />
        <label>{todo.description}</label>
        <button className="destroy"></button>
      </div>
      {/* <input className="edit" value="Create a TodoMVC template" /> */}
    </>
  );
};

(Todo as any).whyDidYouRender = true;

const MemoizedTodo = React.memo(Todo, shallowCompareFragmentReferences("todo"));
export { MemoizedTodo as Todo };
