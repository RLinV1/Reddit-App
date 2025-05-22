const axios = require('axios');

let {app} = require('./server');;

// jest.setTimeout(10000); // Set timeout to 30 seconds

afterAll(async () => {
    await new Promise((r) => setTimeout(r, 1000));

    app.closeServer()
  
  });
  
  

  
  

test('Server is listening on port 8000', async () => {
    const response = await axios.get('http://localhost:8000/testServer');
    expect(response.status).toBe(200);
    expect(response.data).toBe('Server is running');
});
  