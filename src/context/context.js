import React, { useState, useEffect, useContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  // api ye bir saat de 60 request yapabiliyoruz ve websitesini oluşturuken bunları harcamayalım diye sabit bir user bilgisini set ediyoruz. site tamamlanınca datayı fetch ile apiden getiricez

  const [githupUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  // request loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // error
  const [error, setError] = useState({
    show: false,
    msg: "",
  });

  const searchGithubUser = async (user) => {
    toggleError(); // her search den önce hata mesajı default false gelicek
    setIsLoading(true);

    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setGithubUser(response.data); // aradığımız kişinin bilgileri burada

      const { login, followers_url } = response.data;

      // repos ve followers aynı anda gelsin istiyoruz
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        console.log("results",results)
        const [repos, followers ]  = results; 

     

        if (repos.status === "fulfilled") {
          setRepos(repos.value.data);
        }

        if (followers.status === "fulfilled") {
          setFollowers(followers.value.data);
        }
      }).catch((err)=>console.log(err))

    } else {
      toggleError(true, "there is no user with that username");
    }
    checkRequests();
    setIsLoading(false);
  };

  // check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        
        let {
          rate: { remaining },
        } = data;

        setRequests(remaining);
        if (remaining === 0) {
          //throw an error
          toggleError(true, "sory you exceeded your hourly rate limit");
        }
      })
      .catch((err) => console.log(err));
  };

  // error
  function toggleError(show = false, msg = "") {
    setError({
      show,
      msg,
    });
  }

  useEffect(checkRequests, []);

  return (
    <GithubContext.Provider
      value={{
        githupUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
