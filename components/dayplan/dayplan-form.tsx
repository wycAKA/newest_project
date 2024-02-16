import { FC, useState } from "react";
import DateSelector from "../ui-elements/date-selector";

type DayPlanFormProps = {
  onSubmit: (goal: string, date: string) => void;
};

const DayPlanForm: FC<DayPlanFormProps> = ({ onSubmit: onConfirm }) => {
  const [goal, setGoal] = useState("");
  const [date, setDate] = useState(
    new Date(new Date().toISOString().split("T")[0])
  );

  return (
    <div>
      <div>
        <input
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Give the day a goal"
        />
      </div>
      <DateSelector date={date} setDate={setDate} />
      <div>
        <button
          onClick={() => onConfirm(goal, date.toISOString().split("T")[0])}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default DayPlanForm;