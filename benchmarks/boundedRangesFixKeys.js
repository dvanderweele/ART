const tests = [ 
  {
    size: 1,
    nexts: [ 
      {
        repeat: 2
      }, 
      {
        repeat: 4
      }, 
      {
        repeat: 8
      },  
      {
        repeat: 16
      },
      {
        repeat: 32
      }
    ]
  }, 
  {
    size: 2,
    nexts: [ 
      {
        repeat: 2
      }, 
      {
        repeat: 3
      }, 
      {
        repeat: 5
      },  
      {
        repeat: 10
      }
    ]
  }, 
  {
    size: 4,
    nexts: [ 
      {
        repeat: 2
      }, 
      {
        repeat: 3
      }, 
      {
        repeat: 5
      }
    ]
  }, 
  {
    size: 8,
    nexts: [ 
      {
        repeat: 2
      }, 
      {
        repeat: 3
      }
    ]
  }
]

for(let test of tests){
  const memoryLimit = 1_000_000_000
  const { size } = test
  for(let next of nexts){
    gc()
    const baseline = process.memoryUsage().heapUsed
    const { repeat } = next
    const usage = process.memoryUsage()
    while(process.memoryUsage().heapUsed - baseline < memoryLimit){
      ;
    }
  }
}
