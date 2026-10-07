const process_deposits_api_url = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/cron/process-deposits`
const sweep_deposits_api_url = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/cron/sweep-deposits`

//

async function process_deposits() {
    try {
        const response = await fetch(process_deposits_api_url, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })
        console.log(new Date().toLocaleTimeString(), response.status, await response.text())
    }
    catch (error) {
        console.error(new Date().toLocaleTimeString(), error.message)
    }
}


async function sweep_deposits() {
    try {
        const response = await fetch(sweep_deposits_api_url, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })
        console.log(new Date().toLocaleTimeString(), response.status, await response.text())
    }
    catch (error) {
        console.error(new Date().toLocaleTimeString(), error.message)
    }
}

//

process_deposits()
setInterval(process_deposits, 10_000)

sweep_deposits()
setInterval(sweep_deposits, 60_000) 
