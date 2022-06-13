//Getting required packages
const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');

//Starting express app
const app = express();

//Defining port, if default isn't declared use 3000
const PORT = process.env.PORT || 3000;

//Stand-in website for scraping
const website = 'https://www.barnesandnoble.com/s/Sasaki%20and%20Miyano';


try {

  //Axios to pull website information
  axios(website).then((res) => {

    //Take into Cheerio
    const data = res.data;
    const $ = cheerio.load(data);

    const check = $('meta[property="og:description"]').attr('content');

    if(check == "Receive free shipping with your Barnes & Noble Membership."){
      let idList = [];
      let pageList = [];

      //get list of ISBN ids to plug into new search format
      const elements = $(".product-shelf-favorite label").each(function(index, element){
        idList.push($(element).attr('id'));
      });

      //For loop to clean each id for ISBN-13
      for(i = 0; i < idList.length; i++){
        let intThing = idList[i].indexOf('score-')+6;
        idList[i] = idList[i].slice(intThing, intThing+13);
      }

      //Get all imagelink elements that contain the href
      const refElements = $(".pImageLink").each(function(index,element) {
        pageList.push($(element).attr('href'));
      })

      //For loop to clean page list and prep for next stage of scraping
      for(i = 0; i < pageList.length; i++){
        pageList[i] = "https://barnesandnoble.com" + pageList[i].slice(0,pageList[i].indexOf("ean=") + 4) + idList[i];
      }

      console.log(pageList);
    } else{
      console.log("Hit first try");
    }

  });


} catch (error) {
  console.log(error, error.message);
}

app.listen(PORT, () => {
  console.log(`server is running on PORT:${PORT}`);
});

/*
  TODO

  - Load each page into Cheerio and scrub for shipping information
    - Check for existnce of specific class to see if in stock
    - If not there, search for restock date
    - If not there, Not in stock and no restock date/OOP
  - User interface for searching
    -Search cleaning to input into B&N
    -Initial Check to see if got hit right away
*/
