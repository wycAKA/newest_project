import { FC, useEffect, useState } from "react";
import { useAppContext } from "../navigation-menu/AppContext";
import Select from "react-select";
import { type Schema } from "@/amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { Project, SixWeekBatch, SubNextFunctionParam } from "@/helpers/types";
import { filter, flow, get, join, map, uniqBy } from "lodash/fp";
import { makeProjectName, validBatches } from "@/helpers/functional";
import Batch, { getUniqueBatches } from "../batches/batches";

const client = generateClient<Schema>();

type TaskFormProps = {
  onSubmit: (task: string, selectedProject: Project | null) => void;
};

const TaskForm: FC<TaskFormProps> = ({ onSubmit }) => {
  const { context } = useAppContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [task, setTask] = useState("");

  useEffect(() => {
    const query = {
      filter: {
        context: { eq: context },
        done: { ne: "true" },
      },
      selectionSet: [
        "id",
        "project",
        "context",
        "accounts.account.name",
        "batches.sixWeekBatch.id",
        "batches.sixWeekBatch.idea",
        "batches.sixWeekBatch.context",
        "batches.sixWeekBatch.sixWeekCycle.name",
        "batches.sixWeekBatch.sixWeekCycle.startDate",
      ],
    };
    // @ts-expect-error
    const sub = client.models.Projects.observeQuery(query).subscribe({
      next: ({ items, isSynced }: SubNextFunctionParam<Project>) => {
        setProjects([...items]);
      },
    });
    return () => sub.unsubscribe();
  }, [context]);

  const mapOptions = (project: Project) => {
    return {
      value: project.id,
      label: makeProjectName(project),
    };
  };

  const handleChange = (selectedOption: any) => {
    const project = projects.find((p) => p.id === selectedOption.value);
    setSelectedProject(project || null);
  };

  return (
    <div>
      <input
        value={task}
        onChange={(event) => setTask(event.target.value)}
        placeholder="Describe task"
      />
      <Select
        options={projects.map(mapOptions)}
        onChange={handleChange}
        isClearable
        isSearchable
        placeholder="Select project..."
      />
      <button onClick={() => onSubmit(task, selectedProject)}>
        Create Task
      </button>
      <div>
        <h3>Important Six-Week Batches and Projects</h3>
        {flow(
          getUniqueBatches,
          map((batch: SixWeekBatch) => (
            <Batch key={batch.id} batch={batch} projects={projects} />
          ))
        )(projects)}
      </div>
    </div>
  );
};

export default TaskForm;
