import usePermission from "../hooks/usePermission";

// Declarative permission gate for buttons/actions:
//   <Can module={MODULES.STAFF}>
//     <button onClick={handleDelete}>Delete</button>
//   </Can>
// Renders nothing (or `fallback`) when the logged-in admin lacks the module.
const Can = ({ module, fallback = null, children }) => {
  const allowed = usePermission(module);
  return allowed ? children : fallback;
};

export default Can;
