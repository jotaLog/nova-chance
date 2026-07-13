import { api } from "./api";


export async function registerUser(data:any){

    const response = await api.post(
        "/users/register",
        data
    );

    return response.data;
}