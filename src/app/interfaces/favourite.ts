import { Post } from "./post";
import { User } from "./user";

export interface Favourite {
  id: string;
  postId: string;
  userId: string;
  post: {
    id: string;
    photoUrl: string;
    description: string;
    date: string;
    likes: number;
    comments: any[]; 
    user: {
      username: string;
      photoPath: string;
    };
  };
  user: {
    username: string;
    photoPath: string;
  };
}

export interface FavouriteDTO {
  postId: string;
}