import { run_shardable_test } from '../test-harness';

run_shardable_test([
  "det([[2,-(2),3],[1,-(1),-(2)],[-(3),1,5]])",
  "-14",

  "det([[(0+0),-(8),10],[3,4,1],[8,1,8]])",
  "-162",

  "det([[(0+0),(0+0),1],[1,(0+0),1],[(0+0),1,(0+0)]])",
  "1",

  "det([[(0+0),-(7),10],[3,-(2),1],[8,1,8]])",
  "302",

  "det([[1,-(1),1],[-(2),2,-(3)],[4,-(5),9]])",
  "-1",

  "det([[2,-(2),19],[1,-(1),-(8)],[-(3),1,17]])",
  "-70",

  "det([[(0+0),-(8),-(7)],[3,4,-(2)],[8,1,1]])",
  "355",

  "det([[(0+0),-(8)],[3,4]])",
  "24",

  "det([[(0+0),-(7)],[3,-(2)]])",
  "21",
]);