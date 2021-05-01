const constMapInsert = (a, i, v) => {
  return new Map([ ...a, [i, v] ]);
};

const constListReplace = (a, i, v) => {
  return a.map((_v, _i) => {
    return (_i === i) ? v : _v;
  });
}

const constListFlatten = (a) => {
  return a.reduce((list, v) => {
    if (Array.isArray(v)) {
      return list.concat(constListFlatten(v));
    }
    return list.concat(v);
  }, []);
}

const constListFlattenIndices = (a, indices=[]) => {
  return a.reduce((list, v, i) => {
    const nextIndices = [...indices, i];
    if (Array.isArray(v)) {
      return list.concat(constListFlattenIndices(v, nextIndices));
    }
    return list.concat([nextIndices]);
  }, []);
}

export {
  constMapInsert,
  constListReplace,
  constListFlatten,
  constListFlattenIndices
}
