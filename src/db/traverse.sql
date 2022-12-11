--
-- traverse graph with walking each txn in the transaction 
--
WITH RECURSIVE traverse(addr, dir, props) AS (
  SELECT ?, '()', '{}'
  UNION
  SELECT id, '()', properties FROM addresses JOIN traverse ON addr = id
  UNION
  SELECT src, '<-', properties FROM transactions JOIN traverse ON src = addr
  UNION
  SELECT dst, '->', properties FROM transactions JOIN traverse ON dst = addr
) 
SELECT addr, dir, props FROM traverse;
