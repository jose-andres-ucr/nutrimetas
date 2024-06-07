import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import firestore from '@react-native-firebase/firestore';

export type CommonType = {
    id: string;
    name: string;
};

export const fetchDropDownData = async (collectionName: string) => {
    const snapshot = await firestore().collection(collectionName).get();
    const collectionData: CommonType[] =  snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().Name
    }));
    return collectionData;
};

export const useDropDownDataFirestoreQuery = (collectionName: string) => {
    const queryKey = [collectionName] as const;
    const queryClient = useQueryClient();
  
    const { data, error, isLoading } = useQuery<CommonType[]>({
      queryKey,
      queryFn: () => fetchDropDownData(collectionName),
    });
  
    useEffect(() => {
      const unsubscribe = firestore()
        .collection(collectionName)
        .onSnapshot((collectionSnapshot) => {
          const updatedData = collectionSnapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              name: docData.Name,
            };
          });
          queryClient.setQueryData(queryKey, updatedData);
        });
  
      return () => {
        unsubscribe();
      };
    }, []);
  
    return { data, error, isLoading };
};