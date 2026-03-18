import React, { createContext, useContext, useState } from "react";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profilePic, setProfilePic] = useState(null); // stores local URI

  return (
    <ProfileContext.Provider value={{ profilePic, setProfilePic }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
