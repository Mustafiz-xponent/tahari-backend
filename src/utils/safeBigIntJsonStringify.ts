// src/utils/safeBigIntJsonStringify 
const safeBigIntJsonStringify = (param: any): any => {
  return JSON.stringify(param, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
};

export default safeBigIntJsonStringify;
