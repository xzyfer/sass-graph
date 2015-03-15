function unique(collection) {
  return collection.reduce(function (aggregate, input) {
    if (aggregate.indexOf(input) === -1) {
      aggregate.push(input);
    }
    return aggregate;
  }, []);
}

module.exports = unique;
