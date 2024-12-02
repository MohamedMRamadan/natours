/* eslint-disable import/prefer-default-export
 */ export const filterObj = (reqBody, ...fields) => {
  const newObj = {};
  fields.forEach((field) => {
    if (reqBody[field]) newObj[field] = reqBody[field];
  });
  // Object.keys(reqBody).forEach((el) => {
  //   if (fields.includes(el)) newObj[el] = reqBody[el];
  // });
  return newObj;
};
