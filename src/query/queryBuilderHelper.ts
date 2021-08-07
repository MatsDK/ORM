export const isConditionNOT = (
  conditionName: string,
  condition: string
): string => (conditionName.includes("Not") ? `NOT(${condition})` : condition);

export const createCondition = (
  options: any,
  values: any[],
  key: string
): string => {
  if (options[key].name === "Equal") {
    values.push(options[key].raw);

    return `"${key}"=$${values.length}`;
  } else if (options[key].name.includes("IsNull")) {
    return `"${key}" IS ${
      options[key].name.startsWith("Not") ? "NOT" : ""
    } NULL`;
  } else if (options[key].name.includes("LessThan")) {
    values.push(options[key].raw);

    return isConditionNOT(
      options[key].name,
      `"${key}" <${options[key].name.includes("OrEqual") ? "=" : ""} $${
        values.length
      }`
    );
  } else if (options[key].name.includes("MoreThan")) {
    values.push(options[key].raw);

    return isConditionNOT(
      options[key].name,
      `"${key}" >${options[key].name.includes("OrEqual") ? "=" : ""} $${
        values.length
      }`
    );
  } else if (options[key].name.includes("Between")) {
    values.push(options[key].raw[0]);
    values.push(options[key].raw[1]);

    return isConditionNOT(
      options[key].name,
      `"${key}" BETWEEN $${values.length - 1} AND $${values.length}`
    );
  } else if (options[key].name.includes("ILike")) {
    return isConditionNOT(
      options[key].name,
      `"${key}" ILIKE '${options[key].raw}'`
    );
  } else if (options[key].name.includes("Like")) {
    return isConditionNOT(
      options[key].name,
      `"${key}" LIKE '${options[key].raw}'`
    );
  } else if (options[key].name === "Not") {
    values.push(options[key].raw);

    return `"${key}" != $${values.length}`;
  }

  return "";
};
