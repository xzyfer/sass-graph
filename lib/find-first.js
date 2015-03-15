function findFirst(collection, predicate) {
  for (var i = 0; i < collection.length; i++) {
    var item = collection[i];
    if (predicate(item)) {
      return item;
    }
  }
}

module.exports = findFirst;
